import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { RefreshCw, ShieldCheck, Plus } from 'lucide-react';
import { MasterLuxePanel, MasterMetaLine, MasterTabPills, masterGhostBtnClass } from './MasterUiKit';
import { MasterStoreScopeFilter } from './MasterStoreScopeFilter';
import { AdvancedFilterBar } from '../common/AdvancedFilterBar';
import { AdvancedDataTable, type AdvancedTableColumn } from '../common/AdvancedDataTable';
import { pipelineAdvancedList, useAdvancedListState } from '../../hooks/useAdvancedListState';

type SecTab = 'audit' | 'sessions' | 'logins' | 'admins' | 'roles';

type AuditRow = Record<string, unknown>;
type SessionRow = Record<string, unknown>;
type LoginRow = Record<string, unknown>;
type AdminRow = Record<string, unknown>;

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
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [attempts, setAttempts] = useState<LoginRow[]>([]);
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>({});
  const [permList, setPermList] = useState<string[]>([]);
  const [meta, setMeta] = useState<{ total?: number; last_refresh?: string; source?: string }>({});
  const [meEmail, setMeEmail] = useState(session?.user?.email || '');
  const [secTab, setSecTab] = useState<SecTab>('audit');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('read_only_auditor');
  const [mfaStatus, setMfaStatus] = useState('deferred');
  const [storeScope, setStoreScope] = useState<string>('all');
  const [storeStatus, setStoreStatus] = useState<'all' | 'active' | 'pending' | 'suspended'>('all');

  const auditList = useAdvancedListState({
    initialPageSize: 10,
    initialSortKey: 'when',
    initialSortDir: 'desc',
    initialFilters: { action: 'all', entity: 'all' },
  });
  const sessionList = useAdvancedListState({
    initialPageSize: 10,
    initialSortKey: 'email',
    initialSortDir: 'asc',
    initialFilters: { status: 'all' },
  });
  const loginList = useAdvancedListState({
    initialPageSize: 10,
    initialSortKey: 'when',
    initialSortDir: 'desc',
    initialFilters: { result: 'all' },
  });
  const adminList = useAdvancedListState({
    initialPageSize: 10,
    initialSortKey: 'name',
    initialSortDir: 'asc',
    initialFilters: { role: 'all', status: 'all' },
  });

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const actionFilter =
        auditList.filters.action && auditList.filters.action !== 'all'
          ? String(auditList.filters.action)
          : undefined;
      const [logs, me, sess, loginAttempts, adminRes, roleRes, mfa] = await Promise.all([
        fetchAuditLogs({
          per_page: 100,
          action: actionFilter,
          store_id: storeScope !== 'all' ? storeScope : undefined,
        }),
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
  }, [isAr, toast, auditList.filters.action, storeScope]);

  useEffect(() => {
    void load();
  }, [load]);

  const actionOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      const a = String(r.action || '').trim();
      if (a) set.add(a);
    }
    return Array.from(set).sort();
  }, [rows]);

  const entityOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      const e = String(r.entity_type || '').trim();
      if (e) set.add(e);
    }
    return Array.from(set).sort();
  }, [rows]);

  const scopedAudits = useMemo(() => {
    if (storeScope === 'all') return rows;
    return rows.filter((r) => String(r.store_id || '') === storeScope);
  }, [rows, storeScope]);

  const auditPipe = useMemo(
    () =>
      pipelineAdvancedList({
        rows: scopedAudits,
        search: auditList.search,
        getSearchBlob: (row) =>
          `${row.action} ${row.entity_type} ${row.entity_id} ${row.store_id} ${row.user_id}`,
        filters: auditList.filters,
        matchFilter: (row, key, value) => {
          if (key === 'action') return String(row.action || '') === value;
          if (key === 'entity') return String(row.entity_type || '') === value;
          return true;
        },
        dateFrom: auditList.dateFrom,
        dateTo: auditList.dateTo,
        getDate: (row) => (row.created_at ? String(row.created_at) : null),
        sortKey: auditList.sortKey,
        sortDir: auditList.sortDir,
        getSortValue: (row, key) => {
          if (key === 'when') return String(row.created_at || '');
          if (key === 'action') return String(row.action || '');
          if (key === 'entity') return `${row.entity_type || ''}:${row.entity_id || ''}`;
          if (key === 'store') return String(row.store_id || '');
          return '';
        },
        page: auditList.page,
        pageSize: auditList.pageSize,
      }),
    [scopedAudits, auditList],
  );

  const sessionPipe = useMemo(
    () =>
      pipelineAdvancedList({
        rows: sessions,
        search: sessionList.search,
        getSearchBlob: (row) => `${row.email} ${row.ip_address} ${row.user_agent}`,
        filters: sessionList.filters,
        matchFilter: (row, key, value) => {
          if (key === 'status') {
            const isActive = Boolean(row.active) && !row.revoked_at;
            if (value === 'active') return isActive;
            if (value === 'revoked') return !isActive;
            return true;
          }
          return true;
        },
        sortKey: sessionList.sortKey,
        sortDir: sessionList.sortDir,
        getSortValue: (row, key) => {
          if (key === 'email') return String(row.email || '');
          if (key === 'ip') return String(row.ip_address || '');
          if (key === 'status') return row.active ? 1 : 0;
          return '';
        },
        page: sessionList.page,
        pageSize: sessionList.pageSize,
      }),
    [sessions, sessionList],
  );

  const loginPipe = useMemo(
    () =>
      pipelineAdvancedList({
        rows: attempts,
        search: loginList.search,
        getSearchBlob: (row) => `${row.email} ${row.ip_address}`,
        filters: loginList.filters,
        matchFilter: (row, key, value) => {
          if (key === 'result') {
            if (value === 'ok') return Boolean(row.success);
            if (value === 'fail') return !row.success;
            return true;
          }
          return true;
        },
        dateFrom: loginList.dateFrom,
        dateTo: loginList.dateTo,
        getDate: (row) => (row.created_at ? String(row.created_at) : null),
        sortKey: loginList.sortKey,
        sortDir: loginList.sortDir,
        getSortValue: (row, key) => {
          if (key === 'when') return String(row.created_at || '');
          if (key === 'email') return String(row.email || '');
          if (key === 'result') return row.success ? 1 : 0;
          if (key === 'ip') return String(row.ip_address || '');
          return '';
        },
        page: loginList.page,
        pageSize: loginList.pageSize,
      }),
    [attempts, loginList],
  );

  const adminPipe = useMemo(
    () =>
      pipelineAdvancedList({
        rows: admins,
        search: adminList.search,
        getSearchBlob: (row) => `${row.name} ${row.email} ${row.role} ${row.status}`,
        filters: adminList.filters,
        matchFilter: (row, key, value) => {
          if (key === 'role') return String(row.role || '') === value;
          if (key === 'status') return String(row.status || '') === value;
          return true;
        },
        sortKey: adminList.sortKey,
        sortDir: adminList.sortDir,
        getSortValue: (row, key) => {
          if (key === 'name') return String(row.name || '');
          if (key === 'email') return String(row.email || '');
          if (key === 'role') return String(row.role || '');
          if (key === 'status') return String(row.status || '');
          return '';
        },
        page: adminList.page,
        pageSize: adminList.pageSize,
      }),
    [admins, adminList],
  );

  const revokeOne = useCallback(
    async (id: string) => {
      try {
        await revokeMasterSessions({ session_id: id });
        toast(isAr ? 'تم إنهاء الجلسة' : 'Session terminated', 'success');
        await load();
      } catch {
        toast(isAr ? 'فشل الإنهاء' : 'Revoke failed', 'error');
      }
    },
    [isAr, toast, load],
  );

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

  const setAdminStatus = useCallback(
    async (id: string, status: string) => {
      try {
        await patchMasterAdmin(id, { status });
        toast(isAr ? 'تم تحديث الحالة' : 'Status updated', 'success');
        await load();
      } catch {
        toast(isAr ? 'فشل التحديث' : 'Update failed', 'error');
      }
    },
    [isAr, toast, load],
  );

  const auditColumns = useMemo<AdvancedTableColumn<AuditRow>[]>(
    () => [
      {
        key: 'when',
        header: isAr ? 'الوقت' : 'When',
        sortable: true,
        render: (row) => (
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            {String(row.created_at || '—')}
          </span>
        ),
      },
      {
        key: 'action',
        header: isAr ? 'الإجراء' : 'Action',
        sortable: true,
        render: (row) => (
          <span className="font-semibold" style={{ color: 'var(--text)' }}>
            {String(row.action || '—')}
          </span>
        ),
      },
      {
        key: 'entity',
        header: isAr ? 'الكيان' : 'Entity',
        sortable: true,
        render: (row) => (
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            {row.entity_type ? `${row.entity_type}:${row.entity_id || ''}` : '—'}
          </span>
        ),
      },
      {
        key: 'store',
        header: isAr ? 'المتجر' : 'Store',
        sortable: true,
        render: (row) => (
          <span className="text-xs font-mono" style={{ color: 'var(--muted)' }}>
            {String(row.store_id || '—')}
          </span>
        ),
      },
    ],
    [isAr],
  );

  const sessionColumns = useMemo<AdvancedTableColumn<SessionRow>[]>(
    () => [
      {
        key: 'email',
        header: isAr ? 'البريد الإلكتروني' : 'Email',
        sortable: true,
        render: (row) => <span className="text-xs">{String(row.email)}</span>,
      },
      {
        key: 'ip',
        header: isAr ? 'الشبكة' : 'IP',
        sortable: true,
        render: (row) => (
          <span className="text-xs font-mono">{String(row.ip_address || '—')}</span>
        ),
      },
      {
        key: 'status',
        header: isAr ? 'الحالة' : 'Status',
        sortable: true,
        render: (row) => (
          <span className="text-xs">
            {row.active ? (isAr ? 'نشطة' : 'Active') : isAr ? 'منتهية' : 'Revoked'}
          </span>
        ),
      },
      {
        key: 'action',
        header: isAr ? 'إجراء' : 'Action',
        render: (row) =>
          row.active ? (
            <button
              type="button"
              className="text-xs font-bold"
              style={{ color: '#e11d48' }}
              onClick={() => void revokeOne(String(row.id))}
            >
              {isAr ? 'إنهاء' : 'Terminate'}
            </button>
          ) : (
            '—'
          ),
      },
    ],
    [isAr, revokeOne],
  );

  const loginColumns = useMemo<AdvancedTableColumn<LoginRow>[]>(
    () => [
      {
        key: 'when',
        header: isAr ? 'الوقت' : 'When',
        sortable: true,
        render: (row) => <span className="text-xs">{String(row.created_at)}</span>,
      },
      {
        key: 'email',
        header: isAr ? 'البريد الإلكتروني' : 'Email',
        sortable: true,
        render: (row) => <span className="text-xs">{String(row.email)}</span>,
      },
      {
        key: 'result',
        header: isAr ? 'النتيجة' : 'Result',
        sortable: true,
        render: (row) => (
          <span
            className="text-xs font-bold"
            style={{ color: row.success ? '#059669' : '#e11d48' }}
          >
            {row.success ? (isAr ? 'نجاح' : 'OK') : isAr ? 'فشل' : 'Fail'}
          </span>
        ),
      },
      {
        key: 'ip',
        header: isAr ? 'الشبكة' : 'IP',
        sortable: true,
        render: (row) => (
          <span className="text-xs font-mono">{String(row.ip_address || '—')}</span>
        ),
      },
    ],
    [isAr],
  );

  const adminColumns = useMemo<AdvancedTableColumn<AdminRow>[]>(
    () => [
      {
        key: 'name',
        header: isAr ? 'الاسم' : 'Name',
        sortable: true,
        render: (row) => (
          <span className="font-semibold" style={{ color: 'var(--text)' }}>
            {String(row.name)}
          </span>
        ),
      },
      {
        key: 'email',
        header: isAr ? 'البريد الإلكتروني' : 'Email',
        sortable: true,
        render: (row) => (
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            {String(row.email)}
          </span>
        ),
      },
      {
        key: 'role',
        header: isAr ? 'الدور' : 'Role',
        sortable: true,
        render: (row) => (
          <span className="text-xs">
            {ROLE_LABELS[String(row.role)]
              ? isAr
                ? ROLE_LABELS[String(row.role)].ar
                : ROLE_LABELS[String(row.role)].en
              : String(row.role)}
          </span>
        ),
      },
      {
        key: 'status',
        header: isAr ? 'الحالة' : 'Status',
        sortable: true,
        render: (row) => <span className="text-xs">{String(row.status)}</span>,
      },
      {
        key: 'action',
        header: isAr ? 'إجراء' : 'Action',
        render: (row) =>
          String(row.status) === 'active' ? (
            <button
              type="button"
              className="text-xs font-bold"
              style={{ color: '#e11d48' }}
              onClick={() => void setAdminStatus(String(row.id), 'inactive')}
            >
              {isAr ? 'تعطيل' : 'Deactivate'}
            </button>
          ) : (
            <button
              type="button"
              className="text-xs font-bold"
              style={{ color: '#059669' }}
              onClick={() => void setAdminStatus(String(row.id), 'active')}
            >
              {isAr ? 'تفعيل' : 'Activate'}
            </button>
          ),
      },
    ],
    [isAr, setAdminStatus],
  );

  const scopeFilterCount = (storeScope !== 'all' ? 1 : 0) + (storeStatus !== 'all' ? 1 : 0);

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
        <div className="mt-4 space-y-3">
          <MasterStoreScopeFilter
            value={storeScope}
            onChange={setStoreScope}
            statusFilter={storeStatus}
            onStatusFilterChange={setStoreStatus}
            showStatusChips
          />
          <AdvancedFilterBar
            fields={[]}
            filterValues={{}}
            onFilterChange={() => undefined}
            dateFrom={auditList.dateFrom}
            dateTo={auditList.dateTo}
            onDateFromChange={auditList.setDateFrom}
            onDateToChange={auditList.setDateTo}
            showDates
            activeCount={
              scopeFilterCount +
              (auditList.dateFrom ? 1 : 0) +
              (auditList.dateTo ? 1 : 0)
            }
            onReset={() => {
              setStoreScope('all');
              setStoreStatus('all');
              auditList.resetAll();
            }}
          />
          <MasterMetaLine>
            {isAr ? 'المصدر' : 'Source'}: {meta.source || 'audit_logs'} · {meta.total ?? rows.length}
          </MasterMetaLine>
          <AdvancedDataTable
            rows={auditPipe.pageRows}
            columns={auditColumns}
            rowKey={(row) => String(row.id)}
            search={auditList.search}
            onSearchChange={auditList.setSearch}
            searchPlaceholder={isAr ? 'بحث في الإجراءات…' : 'Search actions…'}
            sortKey={auditList.sortKey}
            sortDir={auditList.sortDir}
            onSort={auditList.onSort}
            page={auditPipe.safePage}
            pageSize={auditList.pageSize}
            onPageChange={auditList.setPage}
            onPageSizeChange={auditList.setPageSize}
            total={auditPipe.total}
            loading={busy && rows.length === 0}
            emptyMessage={isAr ? 'لا توجد سجلات' : 'No records found'}
            filters={
              <AdvancedFilterBar
                showDates={false}
                filterValues={auditList.filters}
                onFilterChange={auditList.setFilter}
                onReset={auditList.resetAll}
                activeCount={auditList.activeFilterCount}
                fields={[
                  {
                    key: 'action',
                    label: isAr ? 'الإجراء' : 'Action',
                    options: [
                      { value: 'all', label: isAr ? 'كل الإجراءات' : 'All actions' },
                      ...actionOptions.map((a) => ({ value: a, label: a })),
                    ],
                  },
                  {
                    key: 'entity',
                    label: isAr ? 'الكيان' : 'Entity',
                    options: [
                      { value: 'all', label: isAr ? 'كل الكيانات' : 'All entities' },
                      ...entityOptions.map((e) => ({ value: e, label: e })),
                    ],
                  },
                ]}
              />
            }
          />
        </div>
      ) : null}

      {secTab === 'sessions' ? (
        <div className="mt-4 space-y-2">
          <MasterMetaLine>
            {isAr ? 'المصدر' : 'Source'}: master_sessions · {sessions.length}
          </MasterMetaLine>
          <AdvancedDataTable
            rows={sessionPipe.pageRows}
            columns={sessionColumns}
            rowKey={(row) => String(row.id)}
            search={sessionList.search}
            onSearchChange={sessionList.setSearch}
            searchPlaceholder={isAr ? 'بحث بالبريد…' : 'Search email…'}
            sortKey={sessionList.sortKey}
            sortDir={sessionList.sortDir}
            onSort={sessionList.onSort}
            page={sessionPipe.safePage}
            pageSize={sessionList.pageSize}
            onPageChange={sessionList.setPage}
            onPageSizeChange={sessionList.setPageSize}
            total={sessionPipe.total}
            loading={busy && sessions.length === 0}
            emptyMessage={
              isAr
                ? 'لا جلسات مسجّلة بعد — سجّل الدخول مجدداً لتسجيل الجلسة'
                : 'No session rows yet — sign in again to register a session'
            }
            filters={
              <AdvancedFilterBar
                showDates={false}
                filterValues={sessionList.filters}
                onFilterChange={sessionList.setFilter}
                onReset={sessionList.resetAll}
                activeCount={sessionList.activeFilterCount}
                fields={[
                  {
                    key: 'status',
                    label: isAr ? 'الحالة' : 'Status',
                    options: [
                      { value: 'all', label: isAr ? 'الكل' : 'All' },
                      { value: 'active', label: isAr ? 'نشطة' : 'Active' },
                      { value: 'revoked', label: isAr ? 'منتهية' : 'Revoked' },
                    ],
                  },
                ]}
              />
            }
          />
        </div>
      ) : null}

      {secTab === 'logins' ? (
        <div className="mt-4 space-y-2">
          <MasterMetaLine>
            {isAr ? 'المصدر' : 'Source'}: master_login_attempts · {attempts.length}
          </MasterMetaLine>
          <AdvancedDataTable
            rows={loginPipe.pageRows}
            columns={loginColumns}
            rowKey={(row) => String(row.id)}
            search={loginList.search}
            onSearchChange={loginList.setSearch}
            searchPlaceholder={isAr ? 'بحث بالبريد…' : 'Search email…'}
            sortKey={loginList.sortKey}
            sortDir={loginList.sortDir}
            onSort={loginList.onSort}
            page={loginPipe.safePage}
            pageSize={loginList.pageSize}
            onPageChange={loginList.setPage}
            onPageSizeChange={loginList.setPageSize}
            total={loginPipe.total}
            loading={busy && attempts.length === 0}
            emptyMessage={isAr ? 'لا توجد محاولات' : 'No login attempts recorded'}
            filters={
              <AdvancedFilterBar
                showDates
                dateFrom={loginList.dateFrom}
                dateTo={loginList.dateTo}
                onDateFromChange={loginList.setDateFrom}
                onDateToChange={loginList.setDateTo}
                filterValues={loginList.filters}
                onFilterChange={loginList.setFilter}
                onReset={loginList.resetAll}
                activeCount={loginList.activeFilterCount}
                fields={[
                  {
                    key: 'result',
                    label: isAr ? 'النتيجة' : 'Result',
                    options: [
                      { value: 'all', label: isAr ? 'الكل' : 'All' },
                      { value: 'ok', label: isAr ? 'نجاح' : 'OK' },
                      { value: 'fail', label: isAr ? 'فشل' : 'Fail' },
                    ],
                  },
                ]}
              />
            }
          />
        </div>
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
            <button
              type="button"
              className="unity-btn-primary text-sm inline-flex items-center justify-center gap-1.5"
              onClick={() => void addAdmin()}
            >
              <Plus className="w-3.5 h-3.5" aria-hidden />
              {isAr ? 'إضافة' : 'Add'}
            </button>
          </MasterLuxePanel>
          <AdvancedDataTable
            rows={adminPipe.pageRows}
            columns={adminColumns}
            rowKey={(row) => String(row.id)}
            search={adminList.search}
            onSearchChange={adminList.setSearch}
            searchPlaceholder={isAr ? 'بحث في المشرفين…' : 'Search admins…'}
            sortKey={adminList.sortKey}
            sortDir={adminList.sortDir}
            onSort={adminList.onSort}
            page={adminPipe.safePage}
            pageSize={adminList.pageSize}
            onPageChange={adminList.setPage}
            onPageSizeChange={adminList.setPageSize}
            total={adminPipe.total}
            loading={busy && admins.length === 0}
            emptyMessage={isAr ? 'لا توجد سجلات' : 'No records found'}
            filters={
              <AdvancedFilterBar
                showDates={false}
                filterValues={adminList.filters}
                onFilterChange={adminList.setFilter}
                onReset={adminList.resetAll}
                activeCount={adminList.activeFilterCount}
                fields={[
                  {
                    key: 'role',
                    label: isAr ? 'الدور' : 'Role',
                    options: [
                      { value: 'all', label: isAr ? 'كل الأدوار' : 'All roles' },
                      ...Object.keys(ROLE_LABELS).map((r) => ({
                        value: r,
                        label: isAr ? ROLE_LABELS[r].ar : ROLE_LABELS[r].en,
                      })),
                    ],
                  },
                  {
                    key: 'status',
                    label: isAr ? 'الحالة' : 'Status',
                    options: [
                      { value: 'all', label: isAr ? 'الكل' : 'All' },
                      { value: 'active', label: isAr ? 'نشط' : 'Active' },
                      { value: 'inactive', label: isAr ? 'غير نشط' : 'Inactive' },
                    ],
                  },
                ]}
              />
            }
          />
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
