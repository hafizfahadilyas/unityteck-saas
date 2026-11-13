import React, { useCallback, useEffect, useState } from 'react';
import { AdminPageShell, AdminPageHeader } from '../common/AdminPageHeader';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import { fetchAuditLogs, fetchAuthMe } from '../../api/tenantApi';
import { readAuthSession } from '../../auth/session';
import { RefreshCw, ShieldCheck, Search } from 'lucide-react';

/** SOUQ PLUS Phase 1 §4.9 — audit trail + session summary (no secrets). */
export const MasterSecurityCenter: React.FC = () => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();
  const session = readAuthSession();
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [meta, setMeta] = useState<{ total?: number; last_refresh?: string; source?: string }>({});
  const [q, setQ] = useState('');
  const [meEmail, setMeEmail] = useState(session?.user?.email || '');

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const [logs, me] = await Promise.all([
        fetchAuditLogs({ per_page: 50, action: q.trim() || undefined }),
        fetchAuthMe().catch(() => null),
      ]);
      setRows(Array.isArray(logs?.data) ? logs.data : []);
      setMeta(logs?.meta || {});
      if (me?.user?.email) setMeEmail(me.user.email);
    } catch {
      toast(isAr ? 'تعذر تحميل سجل التدقيق' : 'Failed to load audit log', 'error');
      setRows([]);
    } finally {
      setBusy(false);
    }
  }, [isAr, q, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AdminPageShell>
      <AdminPageHeader
        title={isAr ? 'الأمان والصلاحيات' : 'Security & Permissions'}
        subtitle={
          isAr
            ? 'سجل التدقيق وجلسة المشرف — بدون كلمات مرور أو أسرار'
            : 'Audit trail and admin session — never show passwords or secrets'
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
        <div className="min-w-0 text-sm">
          <p className="font-bold" style={{ color: 'var(--text)' }}>
            {isAr ? 'جلسة المشرف الأعلى' : 'SuperAdmin session'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            {meEmail || '—'} · portal={session?.portal || '—'} · role=
            {session?.user?.role || '—'}
          </p>
          <p className="text-[11px] mt-1" style={{ color: 'var(--muted)' }}>
            {isAr
              ? 'إنهاء الجلسات المتعددة وإعادة تعيين بيانات الدخول حسب السياسة — لا تُعرض الأسرار في الواجهة.'
              : 'Multi-session terminate and credential reset follow policy — secrets never appear in the UI.'}
          </p>
        </div>
      </div>

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
        {isAr ? 'المصدر' : 'Source'}: {meta.source || 'audit_logs'} ·{' '}
        {isAr ? 'آخر تحديث' : 'Last refresh'}: {meta.last_refresh || '—'} ·{' '}
        {isAr ? 'الإجمالي' : 'Total'}: {meta.total ?? rows.length}
      </p>

      <div
        className="mt-3 rounded-2xl border overflow-x-auto"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        {busy && rows.length === 0 ? (
          <div className="p-10 text-center text-sm" style={{ color: 'var(--muted)' }}>
            {isAr ? 'جاري التحميل…' : 'Loading…'}
          </div>
        ) : rows.length === 0 ? (
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
                <th className="text-start p-3 font-semibold">{isAr ? 'المستخدم' : 'User'}</th>
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
                  <td className="p-3 text-xs font-mono" style={{ color: 'var(--muted)' }}>
                    {String(r.user_id || '—')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminPageShell>
  );
};
