import React, { useCallback, useEffect, useState } from 'react';
import { AdminPageShell, AdminPageHeader } from '../common/AdminPageHeader';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import {
  fetchAuditLogs,
  fetchAuthMe,
  fetchMasterLoginAttempts,
  fetchMasterSessions,
  revokeMasterSessions,
} from '../../api/tenantApi';
import { readAuthSession, clearAuthSession } from '../../auth/session';
import { RefreshCw, ShieldCheck, Search } from 'lucide-react';

/** SOUQ PLUS Phase 1 §4.9 — audit + sessions + login attempts (no secrets / no fake MFA). */
export const MasterSecurityCenter: React.FC = () => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();
  const session = readAuthSession();
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [sessions, setSessions] = useState<Array<Record<string, unknown>>>([]);
  const [attempts, setAttempts] = useState<Array<Record<string, unknown>>>([]);
  const [meta, setMeta] = useState<{ total?: number; last_refresh?: string; source?: string }>({});
  const [q, setQ] = useState('');
  const [meEmail, setMeEmail] = useState(session?.user?.email || '');
  const [secTab, setSecTab] = useState<'audit' | 'sessions' | 'logins'>('audit');

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const [logs, me, sess, loginAttempts] = await Promise.all([
        fetchAuditLogs({ per_page: 50, action: q.trim() || undefined }),
        fetchAuthMe().catch(() => null),
        fetchMasterSessions().catch(() => ({ data: [] })),
        fetchMasterLoginAttempts().catch(() => ({ data: [] })),
      ]);
      setRows(Array.isArray(logs?.data) ? logs.data : []);
      setMeta(logs?.meta || {});
      setSessions(Array.isArray(sess?.data) ? sess.data : []);
      setAttempts(Array.isArray(loginAttempts?.data) ? loginAttempts.data : []);
      if (me?.user?.email) setMeEmail(me.user.email);
    } catch {
      toast(isAr ? 'تعذر تحميل الأمان' : 'Failed to load security data', 'error');
      setRows([]);
    } finally {
      setBusy(false);
    }
  }, [isAr, q, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const revokeOne = async (id: string) => {
    try {
      await revokeMasterSessions({ session_id: id });
      toast(isAr ? 'تم إنهاء الجلسة' : 'Session terminated', 'success');
      await load();
    } catch {
      toast(isAr ? 'فشل الإنهاء' : 'Revoke failed', 'error');
    }
  };

  const revokeAll = async () => {
    try {
      await revokeMasterSessions({ all: true });
      toast(isAr ? 'تم إنهاء كل الجلسات — سجّل الدخول مجدداً' : 'All sessions revoked — sign in again', 'success');
      clearAuthSession(true);
      window.location.href = '/master/login';
    } catch {
      toast(isAr ? 'فشل الإنهاء' : 'Revoke failed', 'error');
    }
  };

  return (
    <AdminPageShell>
      <AdminPageHeader
        title={isAr ? 'الأمان والصلاحيات' : 'Security & Permissions'}
        subtitle={
          isAr
            ? 'سجل التدقيق والجلسات ومحاولات الدخول — بدون كلمات مرور أو أسرار'
            : 'Audit, sessions, login attempts — never show passwords or secrets'
        }
        actions={
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-xl border"
            style={{ borderColor: 'var(--border)' }}
            onClick={() => void load()}
            disabled={busy}
            aria-busy={busy}
          >
            <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} aria-hidden />
            {isAr ? 'تحديث' : 'Refresh'}
          </button>
        }
      />

      <div
        className="mt-4 rounded-2xl border p-4 flex flex-col sm:flex-row gap-3 sm:items-center"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
            color: 'var(--accent)',
          }}
        >
          <ShieldCheck className="w-5 h-5" aria-hidden />
        </div>
        <div className="min-w-0 text-sm flex-1">
          <p className="font-bold" style={{ color: 'var(--text)' }}>
            {isAr ? 'جلسة المشرف الأعلى' : 'SuperAdmin session'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            {meEmail || '—'} · portal={session?.portal || '—'} · role=
            {session?.user?.role || '—'}
          </p>
          <p className="text-[11px] mt-1" style={{ color: 'var(--muted)' }}>
            {isAr
              ? 'المصادقة الثنائية غير مربوطة حالياً — لا واجهة وهمية. الأدوار الإضافية لاحقاً.'
              : 'MFA is not wired yet — no fake MFA UI. Extra roles come later.'}
          </p>
        </div>
        <button type="button" className="text-xs font-bold px-3 py-2 rounded-xl border" style={{ borderColor: '#e11d48', color: '#e11d48' }} onClick={() => void revokeAll()}>
          {isAr ? 'إنهاء كل الجلسات' : 'Terminate all sessions'}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {([
          { id: 'audit' as const, en: 'Audit log', ar: 'سجل التدقيق' },
          { id: 'sessions' as const, en: 'Sessions', ar: 'الجلسات' },
          { id: 'logins' as const, en: 'Login attempts', ar: 'محاولات الدخول' },
        ]).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSecTab(t.id)}
            className="text-xs font-bold px-3 py-2 rounded-xl border"
            style={{
              borderColor: secTab === t.id ? 'var(--accent)' : 'var(--border)',
              color: secTab === t.id ? 'var(--accent)' : 'var(--muted)',
            }}
          >
            {isAr ? t.ar : t.en}
          </button>
        ))}
      </div>

      {secTab === 'audit' ? (
        <>
          <div className="mt-4 relative max-w-md">
            <Search
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ [isAr ? 'right' : 'left']: 12, color: 'var(--muted)' }}
              aria-hidden
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void load();
              }}
              className="w-full rounded-xl border text-sm py-2.5 bg-transparent"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--text)',
                paddingInlineStart: 36,
                paddingInlineEnd: 12,
              }}
              placeholder={isAr ? 'تصفية حسب نوع الإجراء…' : 'Filter by action type…'}
            />
          </div>
          <p className="mt-2 text-[11px]" style={{ color: 'var(--muted)' }}>
            {isAr ? 'المصدر' : 'Source'}: {meta.source || 'audit_logs'} · {meta.total ?? rows.length}
          </p>
          <div className="mt-3 rounded-2xl border overflow-x-auto" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
            {rows.length === 0 ? (
              <div className="p-10 text-center text-sm" style={{ color: 'var(--muted)' }}>
                {isAr ? 'لا توجد سجلات' : 'No records found'}
              </div>
            ) : (
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                    <th className="text-start p-3 font-semibold">{isAr ? 'الوقت' : 'When'}</th>
                    <th className="text-start p-3 font-semibold">{isAr ? 'الإجراء' : 'Action'}</th>
                    <th className="text-start p-3 font-semibold">{isAr ? 'الكيان' : 'Entity'}</th>
                    <th className="text-start p-3 font-semibold">{isAr ? 'المتجر' : 'Store'}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={String(r.id)} style={{ borderTop: '1px solid var(--border)' }}>
                      <td className="p-3 text-xs" style={{ color: 'var(--muted)' }}>
                        {String(r.created_at || '—')}
                      </td>
                      <td className="p-3 font-semibold" style={{ color: 'var(--text)' }}>
                        {String(r.action || '—')}
                      </td>
                      <td className="p-3 text-xs" style={{ color: 'var(--muted)' }}>
                        {r.entity_type ? `${r.entity_type}:${r.entity_id || ''}` : '—'}
                      </td>
                      <td className="p-3 text-xs font-mono" style={{ color: 'var(--muted)' }}>
                        {String(r.store_id || '—')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : null}

      {secTab === 'sessions' ? (
        <div className="mt-4 rounded-2xl border overflow-x-auto" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          {sessions.length === 0 ? (
            <div className="p-10 text-center text-sm" style={{ color: 'var(--muted)' }}>
              {isAr
                ? 'لا جلسات مسجّلة بعد — سجّل الدخول مجدداً لتسجيل الجلسة'
                : 'No session rows yet — sign in again to register a session'}
            </div>
          ) : (
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  <th className="text-start p-3">{isAr ? 'البريد' : 'Email'}</th>
                  <th className="text-start p-3">{isAr ? 'الشبكة' : 'IP'}</th>
                  <th className="text-start p-3">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="text-start p-3">{isAr ? 'إجراء' : 'Action'}</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={String(s.id)} style={{ borderTop: '1px solid var(--border)' }}>
                    <td className="p-3 text-xs">{String(s.email)}</td>
                    <td className="p-3 text-xs font-mono">{String(s.ip_address || '—')}</td>
                    <td className="p-3 text-xs">
                      {s.active ? (isAr ? 'نشطة' : 'Active') : isAr ? 'منتهية' : 'Revoked'}
                    </td>
                    <td className="p-3">
                      {s.active ? (
                        <button type="button" className="text-xs font-bold" style={{ color: '#e11d48' }} onClick={() => void revokeOne(String(s.id))}>
                          {isAr ? 'إنهاء' : 'Terminate'}
                        </button>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : null}

      {secTab === 'logins' ? (
        <div className="mt-4 rounded-2xl border overflow-x-auto" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          {attempts.length === 0 ? (
            <div className="p-10 text-center text-sm" style={{ color: 'var(--muted)' }}>
              {isAr ? 'لا توجد محاولات' : 'No login attempts recorded'}
            </div>
          ) : (
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  <th className="text-start p-3">{isAr ? 'الوقت' : 'When'}</th>
                  <th className="text-start p-3">{isAr ? 'البريد' : 'Email'}</th>
                  <th className="text-start p-3">{isAr ? 'النتيجة' : 'Result'}</th>
                  <th className="text-start p-3">{isAr ? 'الشبكة' : 'IP'}</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => (
                  <tr key={String(a.id)} style={{ borderTop: '1px solid var(--border)' }}>
                    <td className="p-3 text-xs">{String(a.created_at)}</td>
                    <td className="p-3 text-xs">{String(a.email)}</td>
                    <td className="p-3 text-xs font-bold" style={{ color: a.success ? '#059669' : '#e11d48' }}>
                      {a.success ? (isAr ? 'نجاح' : 'OK') : isAr ? 'فشل' : 'Fail'}
                    </td>
                    <td className="p-3 text-xs font-mono">{String(a.ip_address || '—')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : null}
    </AdminPageShell>
  );
};
