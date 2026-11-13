import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminPageShell, AdminPageHeader } from '../common/AdminPageHeader';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import {
  fetchMasterSubscriptions,
  fetchPlansCatalog,
  patchStoreSubscription,
} from '../../api/tenantApi';
import { Crown, RefreshCw, Search } from 'lucide-react';
import { GlobalModal } from '../common/GlobalModal';

type TabKey = 'plans' | 'subscriptions';

/** SOUQ PLUS Phase 1 §4.4 — plan catalogue + subscription lifecycle (real API). */
export const MasterPlansSubscriptions: React.FC = () => {
  const { locale, money } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();
  const [tab, setTab] = useState<TabKey>('plans');
  const [busy, setBusy] = useState(false);
  const [plans, setPlans] = useState<Array<Record<string, unknown>>>([]);
  const [subs, setSubs] = useState<Array<Record<string, unknown>>>([]);
  const [meta, setMeta] = useState<{ near_expiry?: number; last_refresh?: string; source?: string }>({});
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState<Record<string, unknown> | null>(null);
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState('active');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const [p, s] = await Promise.all([fetchPlansCatalog(), fetchMasterSubscriptions()]);
      setPlans(Array.isArray(p?.data) ? p.data : []);
      setSubs(Array.isArray(s?.data) ? s.data : []);
      setMeta(s?.meta || {});
    } catch (e) {
      toast(
        isAr ? 'تعذر تحميل الباقات أو الاشتراكات' : 'Failed to load plans or subscriptions',
        'error',
      );
      setPlans([]);
      setSubs([]);
    } finally {
      setBusy(false);
    }
  }, [isAr, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredSubs = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return subs;
    return subs.filter((row) => {
      const blob = `${row.store_id} ${row.store_name} ${row.plan} ${JSON.stringify(row.lifecycle)}`.toLowerCase();
      return blob.includes(needle);
    });
  }, [subs, q]);

  const openEdit = (row: Record<string, unknown>) => {
    const life = (row.lifecycle || {}) as Record<string, unknown>;
    setEdit(row);
    setStatus(String(life.status || 'active'));
    setReason('');
  };

  const saveEdit = async () => {
    if (!edit?.store_id) return;
    if (!reason.trim()) {
      toast(isAr ? 'سبب التغيير مطلوب' : 'Reason is required', 'error');
      return;
    }
    setSaving(true);
    try {
      await patchStoreSubscription(String(edit.store_id), {
        status,
        reason: reason.trim(),
      });
      toast(isAr ? 'تم تحديث الاشتراك' : 'Subscription updated', 'success');
      setEdit(null);
      await load();
    } catch {
      toast(isAr ? 'فشل تحديث الاشتراك' : 'Subscription update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const statusLabel = (s: string) => {
    const map: Record<string, { en: string; ar: string }> = {
      trial: { en: 'Trial', ar: 'تجريبي' },
      active: { en: 'Active', ar: 'نشط' },
      grace: { en: 'Grace', ar: 'مهلة' },
      expired: { en: 'Expired', ar: 'منتهي' },
      suspended: { en: 'Suspended', ar: 'موقوف' },
      cancelled: { en: 'Cancelled', ar: 'ملغى' },
    };
    const hit = map[s] || { en: s || 'Unknown', ar: s || 'غير معروف' };
    return isAr ? hit.ar : hit.en;
  };

  return (
    <AdminPageShell>
      <AdminPageHeader
        title={isAr ? 'الاشتراكات والباقات' : 'Subscriptions & Plans'}
        subtitle={
          isAr
            ? 'كتالوج الباقات ودورة اشتراك التجار — مصدر حقيقي فقط'
            : 'Plan catalogue and merchant subscription lifecycle — live source only'
        }
        actions={
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-xl border"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            onClick={() => void load()}
            disabled={busy}
            aria-busy={busy}
          >
            <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} aria-hidden />
            {isAr ? 'تحديث' : 'Refresh'}
          </button>
        }
      />

      <div className="mt-4 flex flex-wrap gap-2">
        {(
          [
            { id: 'plans' as const, en: 'Plans', ar: 'الباقات' },
            { id: 'subscriptions' as const, en: 'Subscriptions', ar: 'الاشتراكات' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className="px-3 py-2 rounded-xl text-xs font-bold border"
            style={{
              background: tab === t.id ? 'var(--portal-cta)' : 'var(--surface)',
              color: tab === t.id ? '#fff' : 'var(--text)',
              borderColor: tab === t.id ? 'var(--portal-cta)' : 'var(--border)',
            }}
          >
            {isAr ? t.ar : t.en}
          </button>
        ))}
      </div>

      <p className="mt-2 text-[11px]" style={{ color: 'var(--muted)' }}>
        {isAr ? 'آخر تحديث' : 'Last refresh'}: {meta.last_refresh || '—'} ·{' '}
        {isAr ? 'المصدر' : 'Source'}: {meta.source || 'plans/subscriptions'} ·{' '}
        {isAr ? 'قرب الانتهاء' : 'Near expiry'}: {meta.near_expiry ?? 0}
      </p>

      {tab === 'plans' ? (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {busy && plans.length === 0 ? (
            <div className="text-sm" style={{ color: 'var(--muted)' }}>
              {isAr ? 'جاري التحميل…' : 'Loading…'}
            </div>
          ) : plans.length === 0 ? (
            <div className="text-sm" style={{ color: 'var(--muted)' }}>
              {isAr ? 'لا توجد باقات' : 'No records found'}
            </div>
          ) : (
            plans.map((p) => (
              <div
                key={String(p.id || p.code)}
                className="rounded-2xl border p-4"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-4 h-4" style={{ color: 'var(--accent)' }} aria-hidden />
                  <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                    {String(p.name || p.code)}
                  </h3>
                </div>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  {String(p.code)} ·{' '}
                  {p.price_sar == null
                    ? isAr
                      ? 'سعر مخصص / غير محدد'
                      : 'Custom / unset'
                    : money(Number(p.price_sar) || 0)}
                </p>
                <ul className="mt-3 text-[11px] space-y-1" style={{ color: 'var(--muted)' }}>
                  <li>
                    {isAr ? 'حد المنتجات' : 'Product limit'}:{' '}
                    {p.product_limit == null ? '∞' : String(p.product_limit)}
                  </li>
                  <li>
                    {isAr ? 'التخزين (ميجابايت)' : 'Storage (MB)'}:{' '}
                    {p.storage_mb == null ? '∞' : String(p.storage_mb)}
                  </li>
                  <li>
                    {isAr ? 'مقاعد الفريق' : 'Team seats'}:{' '}
                    {p.team_seats == null ? '∞' : String(p.team_seats)}
                  </li>
                </ul>
              </div>
            ))
          )}
        </div>
      ) : (
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
              className="w-full rounded-xl border text-sm py-2.5 bg-transparent"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--text)',
                paddingInlineStart: 36,
                paddingInlineEnd: 12,
              }}
              placeholder={isAr ? 'بحث بالمتجر أو الباقة…' : 'Search store or plan…'}
            />
          </div>
          <div
            className="mt-4 rounded-2xl border overflow-x-auto"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
          >
            {filteredSubs.length === 0 ? (
              <div className="p-10 text-center text-sm" style={{ color: 'var(--muted)' }}>
                {isAr ? 'لا توجد سجلات' : 'No records found'}
              </div>
            ) : (
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                    <th className="text-start p-3 font-semibold">{isAr ? 'المتجر' : 'Store'}</th>
                    <th className="text-start p-3 font-semibold">{isAr ? 'الباقة' : 'Plan'}</th>
                    <th className="text-start p-3 font-semibold">{isAr ? 'الحالة' : 'Status'}</th>
                    <th className="text-start p-3 font-semibold">{isAr ? 'ينتهي' : 'Ends'}</th>
                    <th className="text-start p-3 font-semibold">{isAr ? 'إجراء' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubs.map((row) => {
                    const life = (row.lifecycle || {}) as Record<string, unknown>;
                    return (
                      <tr key={String(row.store_id)} style={{ borderTop: '1px solid var(--border)' }}>
                        <td className="p-3">
                          <div className="font-semibold" style={{ color: 'var(--text)' }}>
                            {String(row.store_name || row.store_id)}
                          </div>
                          <div className="text-[11px] font-mono" style={{ color: 'var(--muted)' }}>
                            {String(row.store_id)}
                          </div>
                        </td>
                        <td className="p-3 capitalize" style={{ color: 'var(--muted)' }}>
                          {String(row.plan || '—')}
                        </td>
                        <td className="p-3">{statusLabel(String(life.status || ''))}</td>
                        <td className="p-3 text-xs" style={{ color: 'var(--muted)' }}>
                          {life.ends_at ? String(life.ends_at).slice(0, 10) : '—'}
                        </td>
                        <td className="p-3">
                          <button
                            type="button"
                            className="text-xs font-bold"
                            style={{ color: 'var(--accent)' }}
                            onClick={() => openEdit(row)}
                          >
                            {isAr ? 'تعديل' : 'Edit'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      <GlobalModal
        isOpen={!!edit}
        onClose={() => setEdit(null)}
        aria-label={isAr ? 'تحديث الاشتراك' : 'Update subscription'}
      >
        <div
          className="rounded-2xl border max-w-md w-full p-5 space-y-3 shadow-xl"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>
            {isAr ? 'تحديث الاشتراك' : 'Update subscription'}
          </h2>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            {String(edit?.store_name || '')} · {String(edit?.store_id || '')}
          </p>
          <label className="block text-xs font-semibold" style={{ color: 'var(--text)' }}>
            {isAr ? 'الحالة' : 'Status'}
            <select
              className="mt-1 w-full rounded-xl border text-sm py-2 px-3 bg-transparent"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {['trial', 'active', 'grace', 'expired', 'suspended'].map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s)}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold" style={{ color: 'var(--text)' }}>
            {isAr ? 'السبب (إلزامي)' : 'Reason (required)'}
            <textarea
              className="mt-1 w-full rounded-xl border text-sm py-2 px-3 bg-transparent min-h-[80px]"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="px-3 py-2 rounded-xl border text-sm"
              style={{ borderColor: 'var(--border)' }}
              onClick={() => setEdit(null)}
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="button"
              className="unity-btn-primary text-sm"
              onClick={() => void saveEdit()}
              disabled={saving}
              aria-busy={saving}
            >
              {isAr ? 'حفظ' : 'Save'}
            </button>
          </div>
        </div>
      </GlobalModal>
    </AdminPageShell>
  );
};
