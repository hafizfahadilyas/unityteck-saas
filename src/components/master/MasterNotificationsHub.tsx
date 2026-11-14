import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminPageShell, AdminPageHeader } from '../common/AdminPageHeader';
import { AdvancedFilterBar } from '../common/AdvancedFilterBar';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import { useTenant } from '../../context/TenantContext';
import {
  Bell,
  AlertTriangle,
  RefreshCw,
  Store,
  ShoppingBag,
  LifeBuoy,
  ShieldCheck,
  UserPlus,
  ArrowRight,
  CheckCheck,
  Archive,
  Loader2,
  CircleDot,
} from 'lucide-react';
import { formatRelativeTime } from '../../notification-system/utils/dateFilters';
import { fetchMasterNotifications, markMasterNotifications } from '../../api/tenantApi';
import { MasterLuxePanel, MasterMetaLine, masterGhostBtnClass } from './MasterUiKit';
import { MasterStoreScopeFilter } from './MasterStoreScopeFilter';
import { getStoreDisplayName } from '../../utils/storeLocalization';

type NotifyRow = Record<string, unknown>;

const severityStyle = (severity: string): { bg: string; color: string; border: string } => {
  if (severity === 'Critical') {
    return {
      bg: 'color-mix(in srgb, #e11d48 12%, transparent)',
      color: '#e11d48',
      border: 'color-mix(in srgb, #e11d48 28%, transparent)',
    };
  }
  if (severity === 'High' || severity === 'Medium') {
    return {
      bg: 'color-mix(in srgb, #d97706 12%, transparent)',
      color: '#d97706',
      border: 'color-mix(in srgb, #d97706 28%, transparent)',
    };
  }
  return {
    bg: 'color-mix(in srgb, var(--accent) 12%, transparent)',
    color: 'var(--accent)',
    border: 'color-mix(in srgb, var(--accent) 28%, transparent)',
  };
};

const categoryIcon = (category: string, source: string) => {
  const key = `${category} ${source}`.toLowerCase();
  if (key.includes('order')) return ShoppingBag;
  if (key.includes('support')) return LifeBuoy;
  if (key.includes('onboard')) return UserPlus;
  if (key.includes('store')) return Store;
  if (key.includes('system') || key.includes('ops') || key.includes('health')) return ShieldCheck;
  return Bell;
};

/** SOUQ PLUS Phase 1 §4.10 — persisted platform_notifications (MySQL). */
export const MasterNotificationsHub: React.FC<{
  onNavigateTab?: (tab: string) => void;
}> = ({ onNavigateTab }) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();
  const { stores } = useTenant();
  const [events, setEvents] = useState<NotifyRow[]>([]);
  const [meta, setMeta] = useState<{ new?: number; source?: string; total?: number }>({});
  const [busy, setBusy] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [storeScope, setStoreScope] = useState<string>('all');
  const [storeStatus, setStoreStatus] = useState<'all' | 'active' | 'pending' | 'suspended'>('all');
  const [filters, setFilters] = useState({ status: 'all', severity: 'all', category: 'all' });
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

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

  const resolveStoreId = (ev: NotifyRow): string | null => {
    const direct = String(ev.store_id || ev.storeId || '').trim();
    if (direct) return direct;
    const ref = String(ev.source_ref || '').trim();
    if (!ref) return null;
    if (stores.some((s) => s.id === ref)) return ref;
    const m = ref.match(/store[-_]?[\w-]+/i);
    if (m && stores.some((s) => s.id === m[0])) return m[0];
    return null;
  };

  const localize = (ev: NotifyRow) => {
    const titleEn = String(ev.title || '');
    const titleAr = String(ev.title_ar || '').trim();
    const descEn = String(ev.description || '');
    const descAr = String(ev.description_ar || '').trim();
    return {
      title: isAr && titleAr ? titleAr : titleEn,
      description: isAr && descAr ? descAr : descEn,
    };
  };

  const filtered = useMemo(() => {
    const fromTs = dateFrom ? Date.parse(`${dateFrom}T00:00:00`) : NaN;
    const toTs = dateTo ? Date.parse(`${dateTo}T23:59:59`) : NaN;
    return events.filter((ev) => {
      if (filters.status !== 'all' && String(ev.status || '') !== filters.status) return false;
      if (filters.severity !== 'all' && String(ev.severity || '') !== filters.severity) return false;
      if (filters.category !== 'all' && String(ev.category || ev.source || '') !== filters.category) {
        return false;
      }
      const created = ev.created_at ? Date.parse(String(ev.created_at)) : NaN;
      if (!Number.isNaN(fromTs) && !Number.isNaN(created) && created < fromTs) return false;
      if (!Number.isNaN(toTs) && !Number.isNaN(created) && created > toTs) return false;

      if (storeScope !== 'all') {
        const sid = resolveStoreId(ev);
        if (sid !== storeScope) return false;
      } else if (storeStatus !== 'all') {
        const sid = resolveStoreId(ev);
        if (!sid) return false;
        const st = stores.find((s) => s.id === sid);
        if (!st || st.status !== storeStatus) return false;
      }
      return true;
    });
  }, [events, filters, dateFrom, dateTo, storeScope, storeStatus, stores]);

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    for (const ev of events) {
      const c = String(ev.category || ev.source || '').trim();
      if (c) set.add(c);
    }
    return Array.from(set).sort();
  }, [events]);

  const activeFilterCount =
    (filters.status !== 'all' ? 1 : 0) +
    (filters.severity !== 'all' ? 1 : 0) +
    (filters.category !== 'all' ? 1 : 0) +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0) +
    (storeScope !== 'all' ? 1 : 0) +
    (storeStatus !== 'all' ? 1 : 0);

  const mark = async (ids: string[], status: string) => {
    const id = ids[0] || null;
    setActingId(id);
    try {
      await markMasterNotifications({ ids, status });
      await load();
    } catch {
      toast(isAr ? 'فشل التحديث' : 'Update failed', 'error');
    } finally {
      setActingId(null);
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

  const statusLabel = (status: string) => {
    if (!isAr) return status;
    const map: Record<string, string> = {
      New: 'جديد',
      Acknowledged: 'مؤكد',
      'In Progress': 'قيد المعالجة',
      Resolved: 'محلول',
      Archived: 'مؤرشف',
    };
    return map[status] || status;
  };

  const severityLabel = (severity: string) => {
    if (!isAr) return severity;
    const map: Record<string, string> = {
      Critical: 'حرج',
      High: 'مرتفع',
      Medium: 'متوسط',
      Informational: 'معلوماتي',
    };
    return map[severity] || severity;
  };

  return (
    <AdminPageShell>
      <AdminPageHeader
        title={isAr ? 'مركز الإشعارات' : 'Notifications Center'}
        subtitle={
          isAr
            ? 'إشعارات محفوظة في قاعدة البيانات — فلترة متقدمة لجميع المتاجر'
            : 'Persisted platform notifications from MySQL — advanced multi-store filters'
        }
        badge={
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg"
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
          <>
            <button
              type="button"
              className={masterGhostBtnClass}
              onClick={() => void load()}
              disabled={busy}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} aria-hidden />
              {isAr ? 'تحديث' : 'Refresh'}
            </button>
            <button
              type="button"
              className="unity-btn-primary text-sm"
              onClick={() => void markAll()}
              disabled={busy || unread === 0}
            >
              {isAr ? 'علم الكل كمقروء' : 'Mark all read'}
            </button>
          </>
        }
      />

      <div className="mt-4 flex flex-col gap-3">
        <MasterStoreScopeFilter
          value={storeScope}
          onChange={(id) => setStoreScope(id)}
          statusFilter={storeStatus}
          onStatusFilterChange={setStoreStatus}
          showStatusChips
        />
        <AdvancedFilterBar
          fields={[
            {
              key: 'status',
              label: isAr ? 'الحالة' : 'Status',
              options: [
                { value: 'all', label: isAr ? 'كل الحالات' : 'All statuses' },
                { value: 'New', label: isAr ? 'جديد' : 'New' },
                { value: 'Acknowledged', label: isAr ? 'مؤكد' : 'Acknowledged' },
                { value: 'In Progress', label: isAr ? 'قيد المعالجة' : 'In Progress' },
                { value: 'Resolved', label: isAr ? 'محلول' : 'Resolved' },
                { value: 'Archived', label: isAr ? 'مؤرشف' : 'Archived' },
              ],
            },
            {
              key: 'severity',
              label: isAr ? 'الأهمية' : 'Severity',
              options: [
                { value: 'all', label: isAr ? 'كل المستويات' : 'All severities' },
                { value: 'Critical', label: isAr ? 'حرج' : 'Critical' },
                { value: 'High', label: isAr ? 'مرتفع' : 'High' },
                { value: 'Medium', label: isAr ? 'متوسط' : 'Medium' },
                { value: 'Informational', label: isAr ? 'معلوماتي' : 'Informational' },
              ],
            },
            {
              key: 'category',
              label: isAr ? 'الفئة' : 'Category',
              options: [
                { value: 'all', label: isAr ? 'كل الفئات' : 'All categories' },
                ...categoryOptions.map((c) => ({ value: c, label: c })),
              ],
            },
          ]}
          filterValues={filters}
          onFilterChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          showDates
          activeCount={activeFilterCount}
          onReset={() => {
            setFilters({ status: 'all', severity: 'all', category: 'all' });
            setDateFrom('');
            setDateTo('');
            setStoreScope('all');
            setStoreStatus('all');
          }}
        />
      </div>

      <MasterLuxePanel className="mt-4 overflow-hidden" padding="none">
        {busy && events.length === 0 ? (
          <div className="p-10 text-center text-sm" style={{ color: 'var(--muted)' }}>
            {isAr ? 'جاري التحميل…' : 'Loading…'}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm" style={{ color: 'var(--muted)' }}>
            {events.length === 0
              ? isAr
                ? 'لا توجد سجلات'
                : 'No records found'
              : isAr
                ? 'لا نتائج للفلاتر الحالية'
                : 'No results for current filters'}
          </div>
        ) : (
          <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {filtered.map((ev) => {
              const severity = String(ev.severity || 'Informational');
              const status = String(ev.status || 'New');
              const id = String(ev.id);
              const category = String(ev.category || ev.source || 'system');
              const source = String(ev.source || '');
              const actionTab = String(ev.action_tab || '').trim();
              const sid = resolveStoreId(ev);
              const storeHit = sid ? stores.find((s) => s.id === sid) : undefined;
              const storeName = storeHit
                ? getStoreDisplayName(storeHit, locale)
                : sid
                  ? sid
                  : null;
              const { title, description } = localize(ev);
              const sev = severityStyle(severity);
              const Icon = categoryIcon(category, source);
              const isNew = status === 'New';
              const isActing = actingId === id;

              return (
                <li
                  key={id}
                  className="relative p-4 sm:p-5 transition-colors duration-150"
                  style={{
                    borderColor: 'var(--border)',
                    background: isNew
                      ? 'color-mix(in srgb, var(--accent) 5%, transparent)'
                      : 'transparent',
                  }}
                >
                  {isNew ? (
                    <span
                      className="absolute top-5 start-2 w-2 h-2 rounded-full"
                      style={{ background: 'var(--accent)' }}
                      aria-hidden
                    />
                  ) : null}

                  <div className="flex flex-col sm:flex-row gap-3.5 sm:items-start">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
                      style={{
                        background: sev.bg,
                        color: sev.color,
                        border: `1px solid ${sev.border}`,
                      }}
                    >
                      <Icon className="w-5 h-5" aria-hidden />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 gap-y-1.5">
                        <h4
                          className="text-sm font-bold tracking-tight leading-snug"
                          style={{ color: 'var(--text)' }}
                        >
                          {title}
                        </h4>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: sev.bg, color: sev.color }}
                        >
                          {severityLabel(severity)}
                        </span>
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            background: 'color-mix(in srgb, var(--surface) 80%, transparent)',
                            color: 'var(--muted)',
                            border: '1px solid var(--border)',
                          }}
                        >
                          <CircleDot className="w-3 h-3" aria-hidden />
                          {statusLabel(status)}
                        </span>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize"
                          style={{
                            background: 'color-mix(in srgb, var(--accent) 8%, transparent)',
                            color: 'var(--accent)',
                          }}
                        >
                          {category}
                        </span>
                        {storeName ? (
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{
                              background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
                              color: 'var(--accent)',
                            }}
                          >
                            {storeName}
                          </span>
                        ) : null}
                      </div>

                      {description ? (
                        <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--muted)' }}>
                          {description}
                        </p>
                      ) : null}

                      {ev.created_at ? (
                        <p className="text-[11px] mt-1.5" style={{ color: 'var(--muted)' }}>
                          {formatRelativeTime(String(ev.created_at), locale)}
                        </p>
                      ) : null}

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {isNew ? (
                          <button
                            type="button"
                            disabled={isActing}
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-xl transition-transform active:scale-95 disabled:opacity-60"
                            style={{
                              color: 'var(--accent)',
                              background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                            }}
                            onClick={() => void mark([id], 'Acknowledged')}
                          >
                            {isActing ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
                            ) : (
                              <CheckCheck className="w-3.5 h-3.5" aria-hidden />
                            )}
                            {isAr ? 'تأكيد' : 'Acknowledge'}
                          </button>
                        ) : null}

                        {status !== 'In Progress' && status !== 'Archived' && status !== 'Resolved' ? (
                          <button
                            type="button"
                            disabled={isActing}
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-xl disabled:opacity-60"
                            style={{ color: 'var(--text)', border: '1px solid var(--border)' }}
                            onClick={() => void mark([id], 'In Progress')}
                          >
                            <AlertTriangle className="w-3.5 h-3.5" aria-hidden />
                            {isAr ? 'قيد المعالجة' : 'In progress'}
                          </button>
                        ) : null}

                        {status !== 'Resolved' && status !== 'Archived' ? (
                          <button
                            type="button"
                            disabled={isActing}
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-xl disabled:opacity-60"
                            style={{
                              color: '#059669',
                              background: 'color-mix(in srgb, #059669 10%, transparent)',
                            }}
                            onClick={() => void mark([id], 'Resolved')}
                          >
                            <ShieldCheck className="w-3.5 h-3.5" aria-hidden />
                            {isAr ? 'حل' : 'Resolve'}
                          </button>
                        ) : null}

                        {status !== 'Archived' ? (
                          <button
                            type="button"
                            disabled={isActing}
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-xl disabled:opacity-60"
                            style={{ color: 'var(--muted)', border: '1px solid var(--border)' }}
                            onClick={() => void mark([id], 'Archived')}
                          >
                            <Archive className="w-3.5 h-3.5" aria-hidden />
                            {isAr ? 'أرشفة' : 'Archive'}
                          </button>
                        ) : null}

                        {actionTab && onNavigateTab ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-xl ms-auto"
                            style={{
                              color: 'var(--portal-cta)',
                              background: 'color-mix(in srgb, var(--portal-cta) 10%, transparent)',
                            }}
                            onClick={() => onNavigateTab(actionTab)}
                          >
                            {isAr ? 'فتح' : 'Open'}
                            <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" aria-hidden />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </MasterLuxePanel>
      <MasterMetaLine className="mt-3">
        {isAr ? 'المصدر' : 'Source'}: {meta.source || 'platform_notifications'} ·{' '}
        {isAr ? 'المعروض' : 'Showing'} {filtered.length}/{events.length}
        {typeof meta.total === 'number' ? ` · ${isAr ? 'الإجمالي' : 'Total'} ${meta.total}` : ''}
      </MasterMetaLine>
    </AdminPageShell>
  );
};
