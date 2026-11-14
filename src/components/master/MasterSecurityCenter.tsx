import React, { useCallback, useEffect, useState } from 'react';
import { AdminPageShell, AdminPageHeader } from '../common/AdminPageHeader';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import {
  createMasterAdmin,
  fetchAuditLogs,
  fetchAuthMe,
  fetchMasterAdmins,
  fetchMasterLoginAttempts,
  fetchMasterMfaStatus,
  fetchMasterRoleMatrix,
  fetchMasterSessions,
  patchMasterAdmin,
  putMasterRolePermissions,
  revokeMasterSessions,
} from '../../api/tenantApi';
import { readAuthSession, clearAuthSession } from '../../auth/session';
import { RefreshCw, ShieldCheck, Search, Plus } from 'lucide-react';
import { MasterLuxePanel, MasterMetaLine, MasterTabPills, masterGhostBtnClass } from './MasterUiKit';

type SecTab = 'audit' | 'sessions' | 'logins' | 'admins' | 'roles';

const ROLE_LABELS: Record<string, { en: string; ar: string }> = {
  super_admin: { en: 'Super Admin', ar: 'المشرف الأعلى' },
  operations_manager: { en: 'Operations Manager', ar: 'مدير العمليات' },
  support_agent: { en: 'Support Agent', ar: 'وكيل الدعم' },
  finance_officer: { en: 'Finance Officer', ar: 'مسؤول المالية' },
  technical_administrator: { en: 'Technical Administrator', ar: 'المسؤول التقني' },
  read_only_auditor: { en: 'Read-only Auditor', ar: 'مدقق للقراءة فقط' },
};

const PERM_LABELS: Record<string, { en: string; ar: string }> = {
  view: { en: 'View', ar: 'عرض' },
  create: { en: 'Create', ar: 'إنشاء' },
  edit: { en: 'Edit', ar: 'تعديل' },
  approve: { en: 'Approve', ar: 'اعتماد' },
  suspend: { en: 'Suspend', ar: 'إيقاف' },
  export: { en: 'Export', ar: 'تصدير' },
  manage_settings: { en: 'Settings', ar: 'الإعدادات' },
};

/** SOUQ PLUS Phase 1 §4.9 + Phase 2 — audit/sessions + admins/role matrix (MFA deferred). */
export const MasterSecurityCenter: React.FC = () => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();
  const session = readAuthSession();
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [sessions, setSessions] = useState<Array<Record<string, unknown>>>([]);
  const [attempts, setAttempts] = useState<Array<Record<string, unknown>>>([]);
  const [admins, setAdmins] = useState<Array<Record<string, unknown>>>([]);
  const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>({});
  const [permList, setPermList] = useState<string[]>([]);
  const [meta, setMeta] = useState<{ total?: number; last_refresh?: string; source?: string }>({});
  const [q, setQ] = useState('');
  const [meEmail, setMeEmail] = useState(session?.user?.email || '');
  const [secTab, setSecTab] = useState<SecTab>('audit');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('read_only_auditor');
  const [mfaStatus, setMfaStatus] = useState('deferred');

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const [logs, me, sess, loginAttempts, adminRes, roleRes, mfa] = await Promise.all([
        fetchAuditLogs({ per_page: 50, action: q.trim() || undefined }),
        fetchAuthMe().catch(() => null),
        fetchMasterSessions().catch(() => ({ data: [] })),
        fetchMasterLoginAttempts().catch(() => ({ data: [] })),
        fetchMasterAdmins().catch(() => ({ data: [] })),
        fetchMasterRoleMatrix().catch(() => ({ data: {}, meta: {} })),
        fetchMasterMfaStatus().catch(() => ({ data: { status: 'deferred' } })),
      ]);
      setRows(Array.isArray(logs?.data) ? logs.data : []);
      setMeta(logs?.meta || {});
      setSessions(Array.isArray(sess?.data) ? sess.data : []);
      setAttempts(Array.isArray(loginAttempts?.data) ? loginAttempts.data : []);
      setAdmins(Array.isArray(adminRes?.data) ? adminRes.data : []);
      setMatrix((roleRes?.data as Record<string, Record<string, boolean>>) || {});
      const roleMeta = (roleRes?.meta || {}) as { permissions?: string[] };
      setPermList(
        Array.isArray(roleMeta.permissions) ? roleMeta.permissions : Object.keys(PERM_LABELS),
      );
      setMfaStatus(String(mfa?.data?.status || 'deferred'));
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

  const addAdmin = async () => {
    if (!newName.trim() || !newEmail.trim()) {
      toast(isAr ? 'الاسم والبريد مطلوبان' : 'Name and email required', 'error');
      return;
    }
    try {
      await createMasterAdmin({ name: newName.trim(), email: newEmail.trim(), role: newRole });
      setNewName('');
      setNewEmail('');
      toast(isAr ? 'تم إنشاء المشرف' : 'Admin created', 'success');
      await load();
    } catch {
      toast(isAr ? 'فشل الإنشاء' : 'Create failed', 'error');
    }
  };

  const togglePerm = async (role: string, perm: string, next: boolean) => {
    if (role === 'super_admin') return;
    const current = { ...(matrix[role] || {}) };
    current[perm] = next;
    try {
      await putMasterRolePermissions(role, current);
      setMatrix((prev) => ({ ...prev, [role]: current }));
      toast(isAr ? 'تم تحديث الصلاحيات' : 'Permissions updated', 'success');
    } catch {
      toast(isAr ? 'فشل التحديث' : 'Update failed', 'error');
    }
  };

  const setAdminStatus = async (id: string, status: string) => {
    try {
      await patchMasterAdmin(id, { status });
      toast(isAr ? 'تم تحديث الحالة' : 'Status updated', 'success');
      await load();
    } catch {
      toast(isAr ? 'فشل التحديث' : 'Update failed', 'error');
    }
  };

  return (
    <AdminPageShell>
      <AdminPageHeader
        title={isAr ? 'الأمان والصلاحيات' : 'Security & Permissions'}
        subtitle={
          isAr
            ? 'سجل التدقيق والجلسات والمشرفون ومصفوفة الصلاحيات — بدون أسرار'
            : 'Audit, sessions, admins, and permission matrix — never show secrets'
        }
        actions={
          <button
            type="button"
            className={masterGhostBtnClass}
            onClick={() => void load()}
            disabled={busy}
            aria-busy={busy}
          >
            <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} aria-hidden />
            {isAr ? 'تحديث' : 'Refresh'}
          </button>
        }
      />

      <MasterLuxePanel className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-center" padding="lg">
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
            {meEmail || '—'}
            {' · '}
            {isAr ? 'البوابة' : 'portal'}: {session?.portal || '—'}
            {' · '}
            {isAr ? 'الدور' : 'role'}: {session?.user?.role || '—'}
          </p>
          <MasterMetaLine>
            {isAr
              ? `المصادقة الثنائية: ${mfaStatus} — لا واجهة تسجيل وهمية. الأدوار تُدار من مصفوفة الصلاحيات.`
              : `MFA: ${mfaStatus} — no fake enrollment UI. Roles are managed in the permission matrix.`}
          </MasterMetaLine>
        </div>
        <button
          type="button"
          className="text-xs font-bold px-3 py-2 rounded-xl border"
          style={{ borderColor: '#e11d48', color: '#e11d48' }}
          onClick={() => void revokeAll()}
        >
          {isAr ? 'إنهاء كل الجلسات' : 'Terminate all sessions'}
        </button>
      </MasterLuxePanel>

      <MasterTabPills
        className="mt-4"
        active={secTab}
        onChange={(id) => setSecTab(id as SecTab)}
        tabs={[
          { id: 'audit', label: isAr ? 'سجل التدقيق' : 'Audit log' },
          { id: 'sessions', label: isAr ? 'الجلسات' : 'Sessions' },
          { id: 'logins', label: isAr ? 'محاولات الدخول' : 'Login attempts' },
          { id: 'admins', label: isAr ? 'المشرفون' : 'Admins' },
          { id: 'roles', label: isAr ? 'مصفوفة الصلاحيات' : 'Role matrix' },
        ]}
      />

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
          <MasterMetaLine>
            {isAr ? 'المصدر' : 'Source'}: {meta.source || 'audit_logs'} · {meta.total ?? rows.length}
          </MasterMetaLine>
          <MasterLuxePanel className="mt-3 overflow-x-auto" padding="none">
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
          </MasterLuxePanel>
        </>
      ) : null}

      {secTab === 'sessions' ? (
        <MasterLuxePanel className="mt-4 overflow-x-auto" padding="none">
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
                  <th className="text-start p-3">{isAr ? 'البريد الإلكتروني' : 'Email'}</th>
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
                        <button
                          type="button"
                          className="text-xs font-bold"
                          style={{ color: '#e11d48' }}
                          onClick={() => void revokeOne(String(s.id))}
                        >
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
        </MasterLuxePanel>
      ) : null}

      {secTab === 'logins' ? (
        <MasterLuxePanel className="mt-4 overflow-x-auto" padding="none">
          {attempts.length === 0 ? (
            <div className="p-10 text-center text-sm" style={{ color: 'var(--muted)' }}>
              {isAr ? 'لا توجد محاولات' : 'No login attempts recorded'}
            </div>
          ) : (
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  <th className="text-start p-3">{isAr ? 'الوقت' : 'When'}</th>
                  <th className="text-start p-3">{isAr ? 'البريد الإلكتروني' : 'Email'}</th>
                  <th className="text-start p-3">{isAr ? 'النتيجة' : 'Result'}</th>
                  <th className="text-start p-3">{isAr ? 'الشبكة' : 'IP'}</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => (
                  <tr key={String(a.id)} style={{ borderTop: '1px solid var(--border)' }}>
                    <td className="p-3 text-xs">{String(a.created_at)}</td>
                    <td className="p-3 text-xs">{String(a.email)}</td>
                    <td
                      className="p-3 text-xs font-bold"
                      style={{ color: a.success ? '#059669' : '#e11d48' }}
                    >
                      {a.success ? (isAr ? 'نجاح' : 'OK') : isAr ? 'فشل' : 'Fail'}
                    </td>
                    <td className="p-3 text-xs font-mono">{String(a.ip_address || '—')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </MasterLuxePanel>
      ) : null}

      {secTab === 'admins' ? (
        <div className="mt-4 space-y-4">
          <MasterLuxePanel className="grid grid-cols-1 sm:grid-cols-4 gap-2" padding="lg">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={isAr ? 'الاسم' : 'Name'}
              className="rounded-xl border text-sm px-3 py-2 bg-transparent"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            />
            <input
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder={isAr ? 'البريد الإلكتروني' : 'Email'}
              className="rounded-xl border text-sm px-3 py-2 bg-transparent"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            />
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="rounded-xl border text-sm px-3 py-2 bg-transparent"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              {Object.keys(ROLE_LABELS).map((r) => (
                <option key={r} value={r}>
                  {isAr ? ROLE_LABELS[r].ar : ROLE_LABELS[r].en}
                </option>
              ))}
            </select>
            <button type="button" className="unity-btn-primary text-sm inline-flex items-center justify-center gap-1.5" onClick={() => void addAdmin()}>
              <Plus className="w-3.5 h-3.5" aria-hidden />
              {isAr ? 'إضافة' : 'Add'}
            </button>
          </MasterLuxePanel>
          <MasterLuxePanel padding="none" className="overflow-x-auto">
            {admins.length === 0 ? (
              <div className="p-10 text-center text-sm" style={{ color: 'var(--muted)' }}>
                {isAr ? 'لا توجد سجلات' : 'No records found'}
              </div>
            ) : (
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                    <th className="text-start p-3">{isAr ? 'الاسم' : 'Name'}</th>
                    <th className="text-start p-3">{isAr ? 'البريد الإلكتروني' : 'Email'}</th>
                    <th className="text-start p-3">{isAr ? 'الدور' : 'Role'}</th>
                    <th className="text-start p-3">{isAr ? 'الحالة' : 'Status'}</th>
                    <th className="text-start p-3">{isAr ? 'إجراء' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((a) => (
                    <tr key={String(a.id)} style={{ borderTop: '1px solid var(--border)' }}>
                      <td className="p-3 font-semibold" style={{ color: 'var(--text)' }}>
                        {String(a.name)}
                      </td>
                      <td className="p-3 text-xs" style={{ color: 'var(--muted)' }}>
                        {String(a.email)}
                      </td>
                      <td className="p-3 text-xs">
                        {ROLE_LABELS[String(a.role)]
                          ? isAr
                            ? ROLE_LABELS[String(a.role)].ar
                            : ROLE_LABELS[String(a.role)].en
                          : String(a.role)}
                      </td>
                      <td className="p-3 text-xs">{String(a.status)}</td>
                      <td className="p-3">
                        {String(a.status) === 'active' ? (
                          <button
                            type="button"
                            className="text-xs font-bold"
                            style={{ color: '#e11d48' }}
                            onClick={() => void setAdminStatus(String(a.id), 'inactive')}
                          >
                            {isAr ? 'تعطيل' : 'Deactivate'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="text-xs font-bold"
                            style={{ color: '#059669' }}
                            onClick={() => void setAdminStatus(String(a.id), 'active')}
                          >
                            {isAr ? 'تفعيل' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </MasterLuxePanel>
          <MasterMetaLine>
            {isAr
              ? 'المصدر: platform_admin_users · المصادقة الثنائية مؤجلة'
              : 'Source: platform_admin_users · MFA deferred'}
          </MasterMetaLine>
        </div>
      ) : null}

      {secTab === 'roles' ? (
        <div className="mt-4 space-y-3">
          <MasterMetaLine>
            {isAr
              ? 'صلاحيات المشرف الأعلى مقفلة. لا مصادقة ثنائية وهمية.'
              : 'Super Admin permissions are locked. No fake MFA.'}
          </MasterMetaLine>
          <MasterLuxePanel className="overflow-x-auto" padding="none">
            {Object.keys(matrix).length === 0 ? (
              <div className="p-10 text-center text-sm" style={{ color: 'var(--muted)' }}>
                {isAr ? 'بانتظار البيانات' : 'Waiting for Data'}
              </div>
            ) : (
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                    <th className="text-start p-3">{isAr ? 'الدور' : 'Role'}</th>
                    {permList.map((p) => (
                      <th key={p} className="text-start p-3">
                        {PERM_LABELS[p] ? (isAr ? PERM_LABELS[p].ar : PERM_LABELS[p].en) : p}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(matrix).map(([role, perms]) => (
                    <tr key={role} style={{ borderTop: '1px solid var(--border)' }}>
                      <td className="p-3 font-semibold" style={{ color: 'var(--text)' }}>
                        {ROLE_LABELS[role] ? (isAr ? ROLE_LABELS[role].ar : ROLE_LABELS[role].en) : role}
                      </td>
                      {permList.map((p) => (
                        <td key={p} className="p-3">
                          <input
                            type="checkbox"
                            checked={Boolean(perms[p])}
                            disabled={role === 'super_admin'}
                            onChange={(e) => void togglePerm(role, p, e.target.checked)}
                            aria-label={`${role} ${p}`}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </MasterLuxePanel>
        </div>
      ) : null}
    </AdminPageShell>
  );
};
