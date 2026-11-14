import React, { useEffect, useMemo, useState } from 'react';
import type { OnboardingInvite } from '../../auth/invites';
import { AdminPageShell, AdminPageHeader } from '../common/AdminPageHeader';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import {
  getStoreDisplayName,
  getStoreDisplayOwner,
  getCustomerDisplayName,
} from '../../utils/storeLocalization';
import { listOnboardingInvites } from '../../auth/invites';
import { updateStore } from '../../api/tenantApi';
import { useToast } from '../common/ToastProvider';
import { GlobalModal } from '../common/GlobalModal';
import { Search, Users, Store, UserPlus } from 'lucide-react';

type TabKey = 'merchants' | 'customers' | 'onboarding';

/** SOUQ PLUS Phase 1 §4.2 — merchants / customers / onboarding from real tenant data. */
export const MasterAccountManagement: React.FC<{
  onOpenOnboarding?: () => void;
}> = ({ onOpenOnboarding }) => {
  const { stores, allStoreCustomers, switchToStore, softRefreshTenantData } = useTenant();
  const { locale } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';
  const [tab, setTab] = useState<TabKey>('merchants');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const [invites, setInvites] = useState<OnboardingInvite[]>([]);
  const [actionStoreId, setActionStoreId] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<'active' | 'suspended' | 'pending'>('active');
  const [actionReason, setActionReason] = useState('');
  const [actionBusy, setActionBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void listOnboardingInvites()
      .then((rows) => {
        if (!cancelled) setInvites(rows);
      })
      .catch(() => {
        if (!cancelled) setInvites([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const merchants = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return stores
      .map((s) => ({
        id: s.id,
        name: getStoreDisplayOwner(s, locale) || getStoreDisplayName(s, locale),
        email: String(s.ownerEmail || ''),
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
  }, [stores, q, locale]);

  const customers = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const flat = Object.entries(allStoreCustomers || {}).flatMap(([storeId, list]) =>
      (list || []).map((c) => ({ ...c, storeId })),
    );
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
  }, [allStoreCustomers, q, locale]);

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

  const rows =
    tab === 'merchants' ? merchants : tab === 'customers' ? customers : filteredInvites;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const pageRows = rows.slice(page * pageSize, page * pageSize + pageSize);

  const tabs: { id: TabKey; en: string; ar: string; icon: typeof Users }[] = [
    { id: 'merchants', en: 'Merchants', ar: 'التجار', icon: Store },
    { id: 'customers', en: 'Customers', ar: 'العملاء', icon: Users },
    { id: 'onboarding', en: 'Onboarding Requests', ar: 'طلبات الانضمام', icon: UserPlus },
  ];

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
      await updateStore(actionStoreId, {
        status: actionStatus,
        reason: actionReason.trim(),
      });
      await softRefreshTenantData?.();
      toast(
        isAr ? 'تم تحديث حالة الحساب' : 'Account status updated',
        'success',
      );
      setActionStoreId(null);
    } catch {
      toast(isAr ? 'فشل التحديث — تحقق من الجلسة' : 'Update failed — check Master session', 'error');
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <AdminPageShell>
      <AdminPageHeader
        title={isAr ? 'إدارة الحسابات' : 'Account Management'}
        subtitle={
          isAr
            ? 'التجار والعملاء وطلبات الانضمام على مستوى المنصة'
            : 'Platform merchants, customers, and onboarding requests'
        }
        actions={
          onOpenOnboarding ? (
            <button type="button" className="unity-btn-primary text-sm" onClick={onOpenOnboarding}>
              {isAr ? 'فتح الإعداد' : 'Open Onboarding'}
            </button>
          ) : null
        }
      />

      <div className="mt-4 flex flex-wrap gap-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                setPage(0);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border"
              style={{
                borderColor: active ? 'var(--accent)' : 'var(--border)',
                background: active
                  ? 'color-mix(in srgb, var(--accent) 12%, transparent)'
                  : 'var(--surface)',
                color: active ? 'var(--accent)' : 'var(--muted)',
              }}
            >
              <Icon className="w-3.5 h-3.5" aria-hidden />
              {isAr ? t.ar : t.en}
            </button>
          );
        })}
      </div>

      <div className="mt-4 relative max-w-md">
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

      <div
        className="mt-4 rounded-2xl border overflow-hidden"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        {pageRows.length === 0 ? (
          <div className="p-10 text-center text-sm" style={{ color: 'var(--muted)' }}>
            {isAr ? 'لا توجد سجلات' : 'No records found'}
          </div>
        ) : tab === 'merchants' ? (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                <th className="text-start p-3 font-semibold">{isAr ? 'التاجر' : 'Merchant'}</th>
                <th className="text-start p-3 font-semibold hidden md:table-cell">
                  {isAr ? 'البريد' : 'Email'}
                </th>
                <th className="text-start p-3 font-semibold">{isAr ? 'الحالة' : 'Status'}</th>
                <th className="text-start p-3 font-semibold hidden sm:table-cell">
                  {isAr ? 'الباقة' : 'Plan'}
                </th>
                <th className="text-start p-3 font-semibold">{isAr ? 'إجراء' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {(pageRows as typeof merchants).map((m) => {
                const dup = m.email && duplicateEmails.has(m.email.trim().toLowerCase());
                return (
                  <tr key={m.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td className="p-3">
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
                    <td className="p-3 hidden md:table-cell" style={{ color: 'var(--muted)' }}>
                      {m.email || '—'}
                    </td>
                    <td className="p-3">
                      <span
                        className="text-[11px] font-bold px-2 py-0.5 rounded-md"
                        style={{
                          background:
                            m.status === 'active'
                              ? 'color-mix(in srgb, #10b981 15%, transparent)'
                              : 'color-mix(in srgb, #f59e0b 15%, transparent)',
                          color: m.status === 'active' ? '#059669' : '#d97706',
                        }}
                      >
                        {m.status === 'active'
                          ? isAr
                            ? 'نشط'
                            : 'Active'
                          : m.status === 'pending'
                            ? isAr
                              ? 'قيد المراجعة'
                              : 'Pending'
                            : isAr
                              ? 'موقوف'
                              : 'Suspended'}
                      </span>
                    </td>
                    <td className="p-3 hidden sm:table-cell capitalize" style={{ color: 'var(--muted)' }}>
                      {m.plan}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="text-xs font-bold"
                          style={{ color: 'var(--accent)' }}
                          onClick={() => switchToStore(m.id)}
                        >
                          {isAr ? 'فتح' : 'Open'}
                        </button>
                        {m.status !== 'active' ? (
                          <button
                            type="button"
                            className="text-xs font-bold"
                            style={{ color: '#059669' }}
                            onClick={() => openLifecycle(m.id, 'active')}
                          >
                            {isAr ? 'تفعيل' : 'Activate'}
                          </button>
                        ) : null}
                        {m.status !== 'suspended' ? (
                          <button
                            type="button"
                            className="text-xs font-bold"
                            style={{ color: '#e11d48' }}
                            onClick={() => openLifecycle(m.id, 'suspended')}
                          >
                            {isAr ? 'إيقاف' : 'Suspend'}
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
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                <th className="text-start p-3 font-semibold">{isAr ? 'العميل' : 'Customer'}</th>
                <th className="text-start p-3 font-semibold hidden md:table-cell">
                  {isAr ? 'البريد' : 'Email'}
                </th>
                <th className="text-start p-3 font-semibold">{isAr ? 'المتجر' : 'Store'}</th>
                <th className="text-start p-3 font-semibold hidden sm:table-cell">
                  {isAr ? 'التسجيل' : 'Registered'}
                </th>
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
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                <th className="text-start p-3 font-semibold">{isAr ? 'الدعوة' : 'Invite'}</th>
                <th className="text-start p-3 font-semibold">{isAr ? 'الباقة' : 'Plan'}</th>
                <th className="text-start p-3 font-semibold hidden sm:table-cell">
                  {isAr ? 'الحالة' : 'Status'}
                </th>
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 ? (
        <div className="mt-3 flex items-center justify-between text-xs" style={{ color: 'var(--muted)' }}>
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
