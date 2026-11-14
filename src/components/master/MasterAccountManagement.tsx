import React, { useEffect, useMemo, useState } from 'react';
import type { OnboardingInvite } from '../../auth/invites';
import type { PlanType } from '../../types';
import { AdminPageShell, AdminPageHeader } from '../common/AdminPageHeader';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import {
  getStoreDisplayName,
  getStoreDisplayOwner,
  getCustomerDisplayName,
} from '../../utils/storeLocalization';
import { listOnboardingInvites } from '../../auth/invites';
import {
  createMasterVerification,
  createStoreStatusHistory,
  fetchMasterVerificationQueue,
  patchMasterVerification,
  updateStore,
} from '../../api/tenantApi';
import { isApiEnabled } from '../../api/client';
import {
  findRegisteredMerchantByEmail,
  listRegisteredMerchants,
} from '../../auth/api';
import {
  isStoreLoginEmailActive,
  setStoreLoginEmailActive,
  setStoreLoginEmailOverride,
} from '../../auth/storeEmailAccess';
import { readAuthSession } from '../../auth/session';
import { canDeleteEntities } from '../../auth/roles';
import { useToast } from '../common/ToastProvider';
import { GlobalModal } from '../common/GlobalModal';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Copy,
  ExternalLink,
  Save,
  UserPlus,
  Ban,
  CheckCircle2,
} from 'lucide-react';
import { MasterLuxePanel, MasterMetaLine, MasterTabPills } from './MasterUiKit';
import { MasterStoreScopeFilter } from './MasterStoreScopeFilter';

type TabKey = 'merchants' | 'customers' | 'queue' | 'verification';

type MerchantRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  storeCount: number;
  plan: string;
  registered: string;
  storeName: string;
};

type EditDraft = {
  storeId: string;
  email: string;
  status: 'active' | 'suspended' | 'pending';
  plan: PlanType;
  loginEmailActive: boolean;
};

const PLAN_OPTIONS: PlanType[] = ['free', 'paid', 'pro', 'premium', 'custom'];

/** SOUQ PLUS Phase 1 §4.2 — merchants / customers / queue from real tenant data. */
export const MasterAccountManagement: React.FC<{
  onOpenOnboarding?: () => void;
}> = ({ onOpenOnboarding }) => {
  const {
    stores,
    allStoreCustomers,
    switchToStore,
    softRefreshTenantData,
    updateStoreOwnerEmail,
    updateStorePlan,
    deleteStore,
    addAuditLog,
  } = useTenant();
  const { locale } = usePrefs();
  const { toast, confirm: confirmDialog } = useToast();
  const isAr = locale === 'ar';
  const session = readAuthSession();
  const userCanDelete = canDeleteEntities(session?.user?.role);

  const [tab, setTab] = useState<TabKey>('merchants');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const [emailAccessEpoch, setEmailAccessEpoch] = useState(0);
  const [storeScope, setStoreScope] = useState<string>('all');
  const [storeStatus, setStoreStatus] = useState<'all' | 'active' | 'pending' | 'suspended'>('all');

  const [invites, setInvites] = useState<OnboardingInvite[]>([]);
  const [verifications, setVerifications] = useState<Array<Record<string, unknown>>>([]);
  const [verEmail, setVerEmail] = useState('');
  const [verName, setVerName] = useState('');
  const [verStoreId, setVerStoreId] = useState('');
  const [verReason, setVerReason] = useState('');
  const [actionStoreId, setActionStoreId] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<'active' | 'suspended' | 'pending'>('active');
  const [actionReason, setActionReason] = useState('');
  const [actionBusy, setActionBusy] = useState(false);

  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [editBusy, setEditBusy] = useState(false);

  const resolveLoginEmail = (storeId: string, fallback: string): string => {
    const registered = listRegisteredMerchants().find((m) => m.storeId === storeId);
    if (registered?.email) return registered.email;
    const fromOwner = fallback.trim().toLowerCase();
    if (fromOwner.includes('@')) {
      const merchant = findRegisteredMerchantByEmail(fromOwner);
      if (merchant) return merchant.email;
      return fromOwner;
    }
    return fallback || '';
  };

  const loadVerifications = async () => {
    try {
      const res = await fetchMasterVerificationQueue();
      setVerifications(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setVerifications([]);
    }
  };

  useEffect(() => {
    let cancelled = false;
    void listOnboardingInvites()
      .then((rows) => {
        if (!cancelled) setInvites(rows);
      })
      .catch(() => {
        if (!cancelled) setInvites([]);
      });
    void loadVerifications();
    return () => {
      cancelled = true;
    };
  }, []);

  const merchants = useMemo(() => {
    const needle = q.trim().toLowerCase();
    void emailAccessEpoch;
    return stores
      .filter((s) => (storeScope === 'all' ? true : s.id === storeScope))
      .filter((s) => (storeStatus === 'all' ? true : s.status === storeStatus))
      .map((s) => ({
        id: s.id,
        name: getStoreDisplayOwner(s, locale) || getStoreDisplayName(s, locale),
        email: resolveLoginEmail(s.id, String(s.ownerEmail || s.email || '')),
        phone: String((s as { phone?: string }).phone || ''),
        status: s.status || 'suspended',
        storeCount: 1,
        plan: s.plan || 'free',
        registered: s.createdAt || '',
        storeName: getStoreDisplayName(s, locale),
      }))
      .filter((m) => {
        if (!needle) return true;
        return (
          m.name.toLowerCase().includes(needle) ||
          m.email.toLowerCase().includes(needle) ||
          m.storeName.toLowerCase().includes(needle) ||
          m.id.toLowerCase().includes(needle)
        );
      });
  }, [stores, q, locale, emailAccessEpoch, storeScope, storeStatus]);

  const customers = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const flat = Object.entries(allStoreCustomers || {}).flatMap(([storeId, list]) => {
      if (storeScope !== 'all' && storeId !== storeScope) return [];
      if (storeStatus !== 'all') {
        const st = stores.find((s) => s.id === storeId);
        if (!st || st.status !== storeStatus) return [];
      }
      return (list || []).map((c) => ({ ...c, storeId }));
    });
    return flat.filter((c) => {
      if (!needle) return true;
      const name = getCustomerDisplayName(c.name, locale);
      return (
        name.toLowerCase().includes(needle) ||
        String(c.email || '').toLowerCase().includes(needle) ||
        String(c.phone || '').includes(needle) ||
        String(c.storeId).toLowerCase().includes(needle)
      );
    });
  }, [allStoreCustomers, q, locale, storeScope, storeStatus, stores]);

  const filteredInvites = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return invites.filter((inv) => {
      if (!needle) return true;
      return (
        String(inv.label || '').toLowerCase().includes(needle) ||
        String(inv.token || '').toLowerCase().includes(needle) ||
        String(inv.plan || '').toLowerCase().includes(needle)
      );
    });
  }, [invites, q]);

  const duplicateEmails = useMemo(() => {
    const counts = new Map<string, number>();
    merchants.forEach((m) => {
      const e = m.email.trim().toLowerCase();
      if (!e) return;
      counts.set(e, (counts.get(e) || 0) + 1);
    });
    return new Set([...counts.entries()].filter(([, n]) => n > 1).map(([e]) => e));
  }, [merchants]);

  const filteredVerifications = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return verifications;
    return verifications.filter((v) =>
      `${v.merchant_email} ${v.merchant_name} ${v.store_id} ${v.status} ${v.doc_type}`
        .toLowerCase()
        .includes(needle),
    );
  }, [verifications, q]);

  const rows =
    tab === 'merchants'
      ? merchants
      : tab === 'customers'
        ? customers
        : tab === 'queue'
          ? filteredInvites
          : filteredVerifications;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const pageRows = rows.slice(page * pageSize, page * pageSize + pageSize);

  const copyText = async (text: string, label: string) => {
    const value = String(text || '').trim();
    if (!value) {
      toast(isAr ? 'لا يوجد نص للنسخ' : 'Nothing to copy', 'error');
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      toast(isAr ? `تم نسخ ${label}` : `${label} copied`, 'success');
    } catch {
      toast(isAr ? 'تعذر النسخ' : 'Copy failed', 'error');
    }
  };

  const openEdit = (m: MerchantRow) => {
    setEditDraft({
      storeId: m.id,
      email: m.email === '—' ? '' : m.email,
      status: (m.status === 'active' || m.status === 'pending' || m.status === 'suspended'
        ? m.status
        : 'suspended') as EditDraft['status'],
      plan: (PLAN_OPTIONS.includes(m.plan as PlanType) ? m.plan : 'free') as PlanType,
      loginEmailActive: isStoreLoginEmailActive(m.id),
    });
  };

  const saveEdit = async () => {
    if (!editDraft || editBusy) return;
    const nextEmail = editDraft.email.trim().toLowerCase();
    if (!nextEmail.includes('@') || !nextEmail.includes('.')) {
      toast(isAr ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email address', 'error');
      return;
    }
    const taken = findRegisteredMerchantByEmail(nextEmail);
    if (taken && taken.storeId !== editDraft.storeId) {
      toast(
        isAr
          ? 'هذا البريد مسجّل لمتجر آخر. اختر بريداً مختلفاً.'
          : 'This email is already registered to another store. Choose a different one.',
        'error',
      );
      return;
    }

    setEditBusy(true);
    const store = stores.find((s) => s.id === editDraft.storeId);
    const storeName = store ? getStoreDisplayName(store, locale) : editDraft.storeId;
    const prevStatus = store?.status || null;

    try {
      setStoreLoginEmailOverride(editDraft.storeId, nextEmail);
      updateStoreOwnerEmail(editDraft.storeId, nextEmail);
      setStoreLoginEmailActive(editDraft.storeId, editDraft.loginEmailActive);
      if (store?.plan !== editDraft.plan) {
        updateStorePlan(editDraft.storeId, editDraft.plan);
      }

      if (isApiEnabled()) {
        await updateStore(editDraft.storeId, {
          email: nextEmail,
          owner_email: nextEmail,
          status: editDraft.status,
          plan: editDraft.plan,
          login_email_active: editDraft.loginEmailActive,
          reason: isAr ? 'تحديث الحساب من إدارة الحسابات' : 'Account update from Account Management',
        });
      } else if (prevStatus !== editDraft.status) {
        await updateStore(editDraft.storeId, {
          status: editDraft.status,
          reason: isAr ? 'تحديث الحالة من إدارة الحسابات' : 'Status update from Account Management',
        });
      }

      if (prevStatus && prevStatus !== editDraft.status) {
        try {
          await createStoreStatusHistory({
            store_id: editDraft.storeId,
            from_status: prevStatus,
            to_status: editDraft.status,
            reason: isAr ? 'تحديث من إدارة الحسابات' : 'Updated from Account Management',
          });
        } catch {
          /* history best-effort */
        }
      }

      addAuditLog({
        adminId: 'master-admin-01',
        adminName: 'Souq Platform SuperAdmin',
        storeId: editDraft.storeId,
        action: 'store_update',
        resource: `Store: ${storeName}`,
        details: `Updated email=${nextEmail}, status=${editDraft.status}, plan=${editDraft.plan}, loginActive=${editDraft.loginEmailActive}`,
        status: 'success',
        ipAddress: 'master-console',
      });

      setEmailAccessEpoch((n) => n + 1);
      await softRefreshTenantData?.();
      toast(isAr ? 'تم تحديث الحساب' : 'Account updated', 'success');
      setEditDraft(null);
    } catch (err) {
      toast(
        err instanceof Error
          ? err.message
          : isAr
            ? 'فشل التحديث — تحقق من الجلسة'
            : 'Update failed — check Master session',
        'error',
      );
    } finally {
      setEditBusy(false);
    }
  };

  const handleDelete = async (m: MerchantRow) => {
    if (!userCanDelete) {
      toast(isAr ? 'غير مصرح بالحذف' : 'Delete not permitted', 'error');
      return;
    }
    const ok = await confirmDialog({
      title: isAr ? 'حذف المتجر' : 'Delete store',
      message: isAr
        ? `هل أنت متأكد من حذف «${m.storeName}»؟ لا يمكن التراجع عن هذا الإجراء.`
        : `Are you sure you want to delete ${m.storeName}? This cannot be undone.`,
      confirmLabel: isAr ? 'حذف' : 'Delete',
      cancelLabel: isAr ? 'إلغاء' : 'Cancel',
      danger: true,
    });
    if (!ok) return;
    deleteStore(m.id);
    addAuditLog({
      adminId: 'master-admin-01',
      adminName: 'Souq Platform SuperAdmin',
      storeId: m.id,
      action: 'store_update',
      resource: `Store: ${m.storeName}`,
      details: 'Permanently removed store from platform (Account Management)',
      status: 'success',
      ipAddress: 'master-console',
    });
    toast(isAr ? `تم حذف «${m.storeName}»` : `${m.storeName} deleted`, 'success');
  };

  const addVerification = async () => {
    if (!verEmail.trim() && !verStoreId.trim()) {
      toast(isAr ? 'البريد أو معرّف المتجر مطلوب' : 'Email or store id required', 'error');
      return;
    }
    try {
      await createMasterVerification({
        merchant_email: verEmail.trim(),
        merchant_name: verName.trim(),
        store_id: verStoreId.trim(),
      });
      setVerEmail('');
      setVerName('');
      setVerStoreId('');
      toast(isAr ? 'تمت إضافة طلب التحقق' : 'Verification request added', 'success');
      await loadVerifications();
    } catch {
      toast(isAr ? 'فشل الإنشاء' : 'Create failed', 'error');
    }
  };

  const reviewVerification = async (id: string, status: string) => {
    if ((status === 'rejected' || status === 'cancelled') && !verReason.trim()) {
      toast(isAr ? 'السبب مطلوب' : 'Reason required', 'error');
      return;
    }
    try {
      await patchMasterVerification(id, { status, reason: verReason.trim() });
      setVerReason('');
      toast(isAr ? 'تم تحديث التحقق' : 'Verification updated', 'success');
      await loadVerifications();
    } catch {
      toast(isAr ? 'فشل التحديث' : 'Update failed', 'error');
    }
  };

  const openLifecycle = (storeId: string, status: 'active' | 'suspended' | 'pending') => {
    setActionStoreId(storeId);
    setActionStatus(status);
    setActionReason('');
  };

  const confirmLifecycle = async () => {
    if (!actionStoreId) return;
    if (!actionReason.trim()) {
      toast(isAr ? 'السبب مطلوب' : 'Reason is required', 'error');
      return;
    }
    if (actionBusy) return;
    setActionBusy(true);
    try {
      const prev = stores.find((s) => s.id === actionStoreId)?.status || null;
      await updateStore(actionStoreId, {
        status: actionStatus,
        reason: actionReason.trim(),
      });
      try {
        await createStoreStatusHistory({
          store_id: actionStoreId,
          from_status: prev,
          to_status: actionStatus,
          reason: actionReason.trim(),
        });
      } catch {
        /* history is best-effort; status update already succeeded */
      }
      await softRefreshTenantData?.();
      toast(isAr ? 'تم تحديث حالة الحساب' : 'Account status updated', 'success');
      setActionStoreId(null);
    } catch {
      toast(isAr ? 'فشل التحديث — تحقق من الجلسة' : 'Update failed — check Master session', 'error');
    } finally {
      setActionBusy(false);
    }
  };

  const statusBadge = (status: string) => {
    const label =
      status === 'active'
        ? isAr
          ? 'نشط'
          : 'Active'
        : status === 'pending'
          ? isAr
            ? 'قيد المراجعة'
            : 'Pending'
          : isAr
            ? 'موقوف'
            : 'Suspended';
    return (
      <span
        className="text-[11px] font-bold px-2 py-0.5 rounded-md inline-block"
        style={{
          background:
            status === 'active'
              ? 'color-mix(in srgb, #10b981 15%, transparent)'
              : status === 'pending'
                ? 'color-mix(in srgb, #f59e0b 15%, transparent)'
                : 'color-mix(in srgb, #e11d48 12%, transparent)',
          color: status === 'active' ? '#059669' : status === 'pending' ? '#d97706' : '#e11d48',
        }}
      >
        {label}
      </span>
    );
  };

  const actionBtnClass =
    'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold border transition-opacity hover:opacity-90 cursor-pointer shrink-0';

  return (
    <AdminPageShell>
      <AdminPageHeader
        title={isAr ? 'إدارة الحسابات' : 'Account Management'}
        subtitle={
          isAr
            ? 'التجار والعملاء وطابور الانضمام على مستوى المنصة'
            : 'Platform merchants, customers, and onboarding queue'
        }
        actions={
          <button
            type="button"
            className="unity-btn-primary text-sm inline-flex items-center justify-center gap-1.5 w-full sm:w-auto shrink-0 whitespace-nowrap"
            onClick={() => {
              if (onOpenOnboarding) {
                onOpenOnboarding();
                return;
              }
              toast(
                isAr ? 'صفحة الإعداد غير متاحة حالياً' : 'Onboarding page is not available',
                'error',
              );
            }}
          >
            <UserPlus className="w-3.5 h-3.5" aria-hidden />
            {isAr ? 'فتح الإعداد' : 'Open Onboarding'}
          </button>
        }
      />

      <MasterTabPills
        className="mt-4"
        active={tab}
        onChange={(id) => {
          setTab(id as TabKey);
          setPage(0);
        }}
        tabs={[
          { id: 'merchants', label: isAr ? 'التجار' : 'Merchants' },
          { id: 'customers', label: isAr ? 'العملاء' : 'Customers' },
          { id: 'queue', label: isAr ? 'طابور الانضمام' : 'Onboarding Queue' },
          { id: 'verification', label: isAr ? 'التحقق من المستندات' : 'Doc Verification' },
        ]}
      />

      <div className="mt-4 flex flex-col sm:flex-row sm:items-end gap-3">
        <MasterStoreScopeFilter
          value={storeScope}
          onChange={(id) => {
            setStoreScope(id);
            setPage(0);
          }}
          statusFilter={storeStatus}
          onStatusFilterChange={(s) => {
            setStoreStatus(s);
            setPage(0);
          }}
          showStatusChips
        />
      <div className="relative w-full max-w-full sm:max-w-md flex-1">
        <Search
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
          style={{ [isAr ? 'right' : 'left']: 12, color: 'var(--muted)' }}
          aria-hidden
        />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
          className="w-full rounded-xl border text-sm py-2.5 bg-transparent"
          style={{
            borderColor: 'var(--border)',
            color: 'var(--text)',
            paddingInlineStart: 36,
            paddingInlineEnd: 12,
          }}
          placeholder={isAr ? 'بحث…' : 'Search…'}
        />
      </div>
      </div>

      {tab === 'verification' ? (
        <MasterLuxePanel className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-2" padding="lg">
          <input
            value={verName}
            onChange={(e) => setVerName(e.target.value)}
            placeholder={isAr ? 'اسم التاجر' : 'Merchant name'}
            className="rounded-xl border text-sm px-3 py-2 bg-transparent"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
          />
          <input
            value={verEmail}
            onChange={(e) => setVerEmail(e.target.value)}
            placeholder={isAr ? 'البريد الإلكتروني' : 'Email'}
            className="rounded-xl border text-sm px-3 py-2 bg-transparent"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
          />
          <input
            value={verStoreId}
            onChange={(e) => setVerStoreId(e.target.value)}
            placeholder={isAr ? 'معرّف المتجر' : 'Store id'}
            className="rounded-xl border text-sm px-3 py-2 bg-transparent"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
          />
          <button
            type="button"
            className="unity-btn-primary text-sm inline-flex items-center justify-center gap-1.5"
            onClick={() => void addVerification()}
          >
            <Plus className="w-3.5 h-3.5" aria-hidden />
            {isAr ? 'إضافة للتحقق' : 'Add to queue'}
          </button>
          <input
            value={verReason}
            onChange={(e) => setVerReason(e.target.value)}
            placeholder={isAr ? 'سبب الرفض / الإلغاء (عند الحاجة)' : 'Reject/cancel reason (when needed)'}
            className="sm:col-span-4 rounded-xl border text-sm px-3 py-2 bg-transparent"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
          />
        </MasterLuxePanel>
      ) : null}

      <MasterLuxePanel className="mt-4 overflow-x-auto" padding="none">
        {pageRows.length === 0 ? (
          <div className="p-10 text-center text-sm" style={{ color: 'var(--muted)' }}>
            {isAr ? 'لا توجد سجلات' : 'No records found'}
          </div>
        ) : tab === 'merchants' ? (
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                <th className="text-start p-3 font-semibold">{isAr ? 'التاجر' : 'Merchant'}</th>
                <th className="text-start p-3 font-semibold">
                  {isAr ? 'البريد الإلكتروني' : 'Email'}
                </th>
                <th className="text-start p-3 font-semibold">{isAr ? 'الحالة' : 'Status'}</th>
                <th className="text-start p-3 font-semibold hidden sm:table-cell">
                  {isAr ? 'الباقة' : 'Plan'}
                </th>
                <th className="text-start p-3 font-semibold whitespace-nowrap">
                  {isAr ? 'إجراء' : 'Action'}
                </th>
              </tr>
            </thead>
            <tbody>
              {(pageRows as typeof merchants).map((m) => {
                const dup = m.email && duplicateEmails.has(m.email.trim().toLowerCase());
                const loginActive = isStoreLoginEmailActive(m.id);
                return (
                  <tr key={m.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td className="p-3 align-top">
                      <div className="font-semibold" style={{ color: 'var(--text)' }}>
                        {m.name}
                      </div>
                      <div className="text-[11px]" style={{ color: 'var(--muted)' }}>
                        {m.storeName} · {m.id}
                      </div>
                      {dup ? (
                        <div className="text-[10px] font-bold mt-1" style={{ color: '#d97706' }}>
                          {isAr ? 'بريد مكرر محتمل — مراجعة يدوية' : 'Possible duplicate email — review'}
                        </div>
                      ) : null}
                    </td>
                    <td className="p-3 align-top">
                      <div className="font-mono text-[11px] break-all" style={{ color: 'var(--text)' }} dir="ltr">
                        {m.email || '—'}
                      </div>
                      <div className="mt-1">
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                          style={{
                            background: loginActive
                              ? 'color-mix(in srgb, #10b981 12%, transparent)'
                              : 'color-mix(in srgb, #e11d48 12%, transparent)',
                            color: loginActive ? '#059669' : '#e11d48',
                          }}
                        >
                          {loginActive
                            ? isAr
                              ? 'بريد الدخول نشط'
                              : 'Login email Active'
                            : isAr
                              ? 'بريد الدخول غير نشط'
                              : 'Login email Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 align-top">{statusBadge(m.status)}</td>
                    <td className="p-3 hidden sm:table-cell capitalize align-top" style={{ color: 'var(--muted)' }}>
                      {m.plan}
                    </td>
                    <td className="p-3 align-top">
                      <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                        <button
                          type="button"
                          className={actionBtnClass}
                          style={{
                            color: 'var(--accent)',
                            borderColor: 'color-mix(in srgb, var(--accent) 35%, var(--border))',
                            background: 'color-mix(in srgb, var(--accent) 8%, var(--surface))',
                          }}
                          onClick={() => switchToStore(m.id)}
                          title={isAr ? 'فتح المتجر' : 'Open store'}
                        >
                          <ExternalLink className="w-3 h-3" aria-hidden />
                          {isAr ? 'فتح' : 'Open'}
                        </button>
                        <button
                          type="button"
                          className={actionBtnClass}
                          style={{
                            color: 'var(--text)',
                            borderColor: 'var(--border)',
                            background: 'var(--surface)',
                          }}
                          onClick={() => openEdit(m)}
                          title={isAr ? 'تعديل البريد والحالة والباقة' : 'Edit email, status, plan'}
                        >
                          <Pencil className="w-3 h-3" aria-hidden />
                          {isAr ? 'تعديل' : 'Edit'}
                        </button>
                        <button
                          type="button"
                          className={actionBtnClass}
                          style={{
                            color: 'var(--accent)',
                            borderColor: 'var(--border)',
                            background: 'var(--surface)',
                          }}
                          onClick={() => openEdit(m)}
                          title={isAr ? 'تحديث الحساب' : 'Update account'}
                        >
                          <Save className="w-3 h-3" aria-hidden />
                          {isAr ? 'تحديث' : 'Update'}
                        </button>
                        <button
                          type="button"
                          className={actionBtnClass}
                          style={{
                            color: 'var(--muted)',
                            borderColor: 'var(--border)',
                            background: 'var(--surface)',
                          }}
                          onClick={() => void copyText(m.email || m.id, isAr ? 'البريد / المعرّف' : 'email / id')}
                          title={isAr ? 'نسخ البريد أو المعرّف' : 'Copy email or id'}
                        >
                          <Copy className="w-3 h-3" aria-hidden />
                          {isAr ? 'نسخ' : 'Copy'}
                        </button>
                        {m.status !== 'active' ? (
                          <button
                            type="button"
                            className={actionBtnClass}
                            style={{
                              color: '#059669',
                              borderColor: 'color-mix(in srgb, #10b981 35%, var(--border))',
                              background: 'color-mix(in srgb, #10b981 8%, var(--surface))',
                            }}
                            onClick={() => openLifecycle(m.id, 'active')}
                          >
                            <CheckCircle2 className="w-3 h-3" aria-hidden />
                            {isAr ? 'تفعيل' : 'Activate'}
                          </button>
                        ) : null}
                        {m.status !== 'suspended' ? (
                          <button
                            type="button"
                            className={actionBtnClass}
                            style={{
                              color: '#e11d48',
                              borderColor: 'color-mix(in srgb, #e11d48 35%, var(--border))',
                              background: 'color-mix(in srgb, #e11d48 8%, var(--surface))',
                            }}
                            onClick={() => openLifecycle(m.id, 'suspended')}
                          >
                            <Ban className="w-3 h-3" aria-hidden />
                            {isAr ? 'إيقاف' : 'Suspend'}
                          </button>
                        ) : null}
                        {userCanDelete ? (
                          <button
                            type="button"
                            className={actionBtnClass}
                            style={{
                              color: '#e11d48',
                              borderColor: 'color-mix(in srgb, #e11d48 35%, var(--border))',
                              background: 'color-mix(in srgb, #e11d48 8%, var(--surface))',
                            }}
                            onClick={() => void handleDelete(m)}
                            title={isAr ? 'حذف المتجر' : 'Delete store'}
                          >
                            <Trash2 className="w-3 h-3" aria-hidden />
                            {isAr ? 'حذف' : 'Delete'}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : tab === 'customers' ? (
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                <th className="text-start p-3 font-semibold">{isAr ? 'العميل' : 'Customer'}</th>
                <th className="text-start p-3 font-semibold hidden md:table-cell">
                  {isAr ? 'البريد الإلكتروني' : 'Email'}
                </th>
                <th className="text-start p-3 font-semibold">{isAr ? 'المتجر' : 'Store'}</th>
                <th className="text-start p-3 font-semibold hidden sm:table-cell">
                  {isAr ? 'التسجيل' : 'Registered'}
                </th>
                <th className="text-start p-3 font-semibold">{isAr ? 'إجراء' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {(pageRows as typeof customers).map((c) => (
                <tr key={`${c.storeId}-${c.id}`} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="p-3 font-semibold" style={{ color: 'var(--text)' }}>
                    {getCustomerDisplayName(c.name, locale)}
                  </td>
                  <td className="p-3 hidden md:table-cell" style={{ color: 'var(--muted)' }}>
                    {c.email || '—'}
                  </td>
                  <td className="p-3 text-xs" style={{ color: 'var(--muted)' }}>
                    {c.storeId}
                  </td>
                  <td className="p-3 hidden sm:table-cell text-xs" style={{ color: 'var(--muted)' }}>
                    {c.registeredDate || '—'}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        className={actionBtnClass}
                        style={{
                          color: 'var(--muted)',
                          borderColor: 'var(--border)',
                          background: 'var(--surface)',
                        }}
                        onClick={() =>
                          void copyText(
                            String(c.email || c.id),
                            isAr ? 'البريد / المعرّف' : 'email / id',
                          )
                        }
                      >
                        <Copy className="w-3 h-3" aria-hidden />
                        {isAr ? 'نسخ' : 'Copy'}
                      </button>
                      <button
                        type="button"
                        className={actionBtnClass}
                        style={{
                          color: 'var(--accent)',
                          borderColor: 'color-mix(in srgb, var(--accent) 35%, var(--border))',
                          background: 'color-mix(in srgb, var(--accent) 8%, var(--surface))',
                        }}
                        onClick={() => switchToStore(c.storeId)}
                      >
                        <ExternalLink className="w-3 h-3" aria-hidden />
                        {isAr ? 'فتح' : 'Open'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : tab === 'queue' ? (
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                <th className="text-start p-3 font-semibold">{isAr ? 'الدعوة' : 'Invite'}</th>
                <th className="text-start p-3 font-semibold">{isAr ? 'الباقة' : 'Plan'}</th>
                <th className="text-start p-3 font-semibold hidden sm:table-cell">
                  {isAr ? 'الحالة' : 'Status'}
                </th>
                <th className="text-start p-3 font-semibold">{isAr ? 'إجراء' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {(pageRows as OnboardingInvite[]).map((inv) => {
                const used = Boolean(inv.usedAt);
                const expired = new Date(inv.expiresAt).getTime() < Date.now();
                return (
                  <tr key={inv.token} style={{ borderTop: '1px solid var(--border)' }}>
                    <td className="p-3">
                      <div className="font-semibold" style={{ color: 'var(--text)' }}>
                        {inv.label}
                      </div>
                      <div className="text-[11px] font-mono" style={{ color: 'var(--muted)' }}>
                        {inv.storeId}
                      </div>
                    </td>
                    <td className="p-3 capitalize" style={{ color: 'var(--muted)' }}>
                      {inv.plan}
                    </td>
                    <td className="p-3 hidden sm:table-cell text-xs" style={{ color: 'var(--muted)' }}>
                      {used
                        ? isAr
                          ? 'مستخدمة'
                          : 'Used'
                        : expired
                          ? isAr
                            ? 'منتهية'
                            : 'Expired'
                          : isAr
                            ? 'جديدة'
                            : 'New'}
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        className={actionBtnClass}
                        style={{
                          color: 'var(--muted)',
                          borderColor: 'var(--border)',
                          background: 'var(--surface)',
                        }}
                        onClick={() =>
                          void copyText(String(inv.token || inv.storeId), isAr ? 'الرمز' : 'token')
                        }
                      >
                        <Copy className="w-3 h-3" aria-hidden />
                        {isAr ? 'نسخ' : 'Copy'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                <th className="text-start p-3 font-semibold">{isAr ? 'التاجر' : 'Merchant'}</th>
                <th className="text-start p-3 font-semibold">{isAr ? 'المستند' : 'Document'}</th>
                <th className="text-start p-3 font-semibold">{isAr ? 'الحالة' : 'Status'}</th>
                <th className="text-start p-3 font-semibold">{isAr ? 'إجراء' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {(pageRows as Array<Record<string, unknown>>).map((v) => (
                <tr key={String(v.id)} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="p-3">
                    <div className="font-semibold" style={{ color: 'var(--text)' }}>
                      {String(v.merchant_name || v.merchant_email || '—')}
                    </div>
                    <div className="text-[11px]" style={{ color: 'var(--muted)' }}>
                      {String(v.merchant_email || '')} · {String(v.store_id || '—')}
                    </div>
                  </td>
                  <td className="p-3 text-xs" style={{ color: 'var(--muted)' }}>
                    {String(v.doc_type || '—')}
                  </td>
                  <td className="p-3 text-xs">{String(v.status)}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="text-xs font-bold"
                        style={{ color: '#059669' }}
                        onClick={() => void reviewVerification(String(v.id), 'approved')}
                      >
                        {isAr ? 'اعتماد' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        className="text-xs font-bold"
                        style={{ color: '#e11d48' }}
                        onClick={() => void reviewVerification(String(v.id), 'rejected')}
                      >
                        {isAr ? 'رفض' : 'Reject'}
                      </button>
                      <button
                        type="button"
                        className={actionBtnClass}
                        style={{
                          color: 'var(--muted)',
                          borderColor: 'var(--border)',
                          background: 'var(--surface)',
                        }}
                        onClick={() =>
                          void copyText(
                            String(v.merchant_email || v.store_id || v.id),
                            isAr ? 'البريد' : 'email',
                          )
                        }
                      >
                        <Copy className="w-3 h-3" aria-hidden />
                        {isAr ? 'نسخ' : 'Copy'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </MasterLuxePanel>

      {totalPages > 1 ? (
        <div className="mt-3 flex items-center justify-between text-xs gap-2 flex-wrap" style={{ color: 'var(--muted)' }}>
          <span>
            {isAr ? `صفحة ${page + 1} من ${totalPages}` : `Page ${page + 1} of ${totalPages}`}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 0}
              className="px-2 py-1 rounded border disabled:opacity-40"
              style={{ borderColor: 'var(--border)' }}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              {isAr ? 'السابق' : 'Prev'}
            </button>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              className="px-2 py-1 rounded border disabled:opacity-40"
              style={{ borderColor: 'var(--border)' }}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              {isAr ? 'التالي' : 'Next'}
            </button>
          </div>
        </div>
      ) : null}

      <MasterMetaLine>
        {tab === 'queue'
          ? isAr
            ? 'المصدر: دعوات الانضمام الحقيقية'
            : 'Source: real onboarding invites'
          : tab === 'verification'
            ? isAr
              ? 'المصدر: طابور التحقق من الحسابات'
              : 'Source: account verification queue'
            : isAr
              ? 'المصدر: متاجر وعملاء المنصة'
              : 'Source: platform stores & customers'}
      </MasterMetaLine>

      {/* Edit / Update merchant modal */}
      <GlobalModal
        isOpen={Boolean(editDraft)}
        onClose={() => {
          if (!editBusy) setEditDraft(null);
        }}
        aria-label={isAr ? 'تعديل الحساب' : 'Edit account'}
        contentClassName="w-full max-w-md mx-4 rounded-2xl border p-5"
      >
        {editDraft ? (
          <div
            className="space-y-3 rounded-2xl border p-4"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
          >
            <h3 className="text-sm font-black" style={{ color: 'var(--text)' }}>
              {isAr ? 'تعديل / تحديث الحساب' : 'Edit / Update account'}
            </h3>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              {editDraft.storeId}
            </p>

            <label className="block text-xs font-bold" style={{ color: 'var(--text)' }}>
              {isAr ? 'بريد الدخول' : 'Login email'}
            </label>
            <input
              type="email"
              dir="ltr"
              value={editDraft.email}
              onChange={(e) => setEditDraft({ ...editDraft, email: e.target.value })}
              className="w-full rounded-xl border text-sm p-3 bg-transparent font-mono"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              disabled={editBusy}
            />

            <label className="block text-xs font-bold" style={{ color: 'var(--text)' }}>
              {isAr ? 'حالة المتجر' : 'Store status'}
            </label>
            <select
              value={editDraft.status}
              onChange={(e) =>
                setEditDraft({
                  ...editDraft,
                  status: e.target.value as EditDraft['status'],
                })
              }
              className="w-full rounded-xl border text-sm p-3 bg-transparent"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              disabled={editBusy}
            >
              <option value="active">{isAr ? 'نشط' : 'Active'}</option>
              <option value="pending">{isAr ? 'قيد المراجعة' : 'Pending'}</option>
              <option value="suspended">{isAr ? 'موقوف' : 'Suspended'}</option>
            </select>

            <label className="block text-xs font-bold" style={{ color: 'var(--text)' }}>
              {isAr ? 'الباقة' : 'Plan'}
            </label>
            <select
              value={editDraft.plan}
              onChange={(e) =>
                setEditDraft({ ...editDraft, plan: e.target.value as PlanType })
              }
              className="w-full rounded-xl border text-sm p-3 bg-transparent capitalize"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              disabled={editBusy}
            >
              {PLAN_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-2 text-xs font-bold cursor-pointer" style={{ color: 'var(--text)' }}>
              <input
                type="checkbox"
                checked={editDraft.loginEmailActive}
                onChange={(e) =>
                  setEditDraft({ ...editDraft, loginEmailActive: e.target.checked })
                }
                disabled={editBusy}
              />
              {isAr ? 'بريد الدخول نشط (يسمح بتسجيل الدخول)' : 'Login email Active (allows sign-in)'}
            </label>

            <div className="flex justify-end gap-2 flex-wrap pt-1">
              <button
                type="button"
                className="px-3 py-2 rounded-xl border text-sm"
                style={{ borderColor: 'var(--border)' }}
                disabled={editBusy}
                onClick={() => setEditDraft(null)}
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                className="unity-btn-primary text-sm inline-flex items-center gap-1.5"
                disabled={editBusy}
                aria-busy={editBusy}
                onClick={() => void saveEdit()}
              >
                <Save className="w-3.5 h-3.5" aria-hidden />
                {isAr ? 'حفظ التحديث' : 'Save update'}
              </button>
            </div>
          </div>
        ) : null}
      </GlobalModal>

      <GlobalModal
        isOpen={Boolean(actionStoreId)}
        onClose={() => {
          if (!actionBusy) setActionStoreId(null);
        }}
        aria-label={
          actionStatus === 'active'
            ? isAr
              ? 'تفعيل الحساب'
              : 'Activate account'
            : isAr
              ? 'إيقاف الحساب'
              : 'Suspend account'
        }
        contentClassName="w-full max-w-md mx-4 rounded-2xl border p-5"
      >
        <div
          className="space-y-3 rounded-2xl border p-4"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
        >
          <h3 className="text-sm font-black" style={{ color: 'var(--text)' }}>
            {actionStatus === 'active'
              ? isAr
                ? 'تفعيل الحساب'
                : 'Activate account'
              : isAr
                ? 'إيقاف الحساب'
                : 'Suspend account'}
          </h3>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            {isAr
              ? 'سيتم تطبيق الحالة على المتجر فوراً. السبب يُسجَّل في سجل التدقيق.'
              : 'Status applies to the store immediately. Reason is written to the audit log.'}
          </p>
          <label className="block text-xs font-bold" style={{ color: 'var(--text)' }}>
            {isAr ? 'السبب (مطلوب)' : 'Reason (required)'}
          </label>
          <textarea
            value={actionReason}
            onChange={(e) => setActionReason(e.target.value)}
            rows={3}
            className="w-full rounded-xl border text-sm p-3 bg-transparent"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-3 py-2 rounded-xl border text-sm"
              style={{ borderColor: 'var(--border)' }}
              disabled={actionBusy}
              onClick={() => setActionStoreId(null)}
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="button"
              className="unity-btn-primary text-sm"
              disabled={actionBusy}
              aria-busy={actionBusy}
              onClick={() => void confirmLifecycle()}
            >
              {isAr ? 'تأكيد' : 'Confirm'}
            </button>
          </div>
        </div>
      </GlobalModal>
    </AdminPageShell>
  );
};
