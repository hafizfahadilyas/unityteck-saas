import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminPageShell, AdminPageHeader } from '../common/AdminPageHeader';
import { AdvancedFilterBar } from '../common/AdvancedFilterBar';
import { AdvancedDataTable, type AdvancedTableColumn } from '../common/AdvancedDataTable';
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
  Headphones,
} from 'lucide-react';
import { formatRelativeTime } from '../../notification-system/utils/dateFilters';
import { fetchMasterNotifications, markMasterNotifications } from '../../api/tenantApi';
import { MasterLuxePanel, MasterMetaLine, MasterTabPills, masterGhostBtnClass } from './MasterUiKit';
import { MasterStoreScopeFilter } from './MasterStoreScopeFilter';
import { getStoreDisplayName } from '../../utils/storeLocalization';
import { pipelineAdvancedList, useAdvancedListState } from '../../hooks/useAdvancedListState';
import { MasterHelpChatInbox } from './MasterHelpChatInbox';

type NotifyRow = Record<string, unknown>;
type HubTab = 'notifications' | 'help';

const severityStyle = (severity: string): { bg: string; color: string } => {
  if (severity === 'Critical') {
    return {
      bg: 'color-mix(in srgb, #e11d48 12%, transparent)',
      color: '#e11d48',
    };
  }
  if (severity === 'High' || severity === 'Medium') {
    return {
      bg: 'color-mix(in srgb, #d97706 12%, transparent)',
      color: '#d97706',
    };
  }
  return {
    bg: 'color-mix(in srgb, var(--accent) 12%, transparent)',
    color: 'var(--accent)',
  };
};

const categoryIcon = (category: string, source: string) => {
  const key = `${category} ${source}`.toLowerCase();
  if (key.includes('order')) return ShoppingBag;
  if (key.includes('support') || key.includes('help')) return LifeBuoy;
  if (key.includes('onboard')) return UserPlus;
  if (key.includes('store')) return Store;
  if (key.includes('system') || key.includes('ops') || key.includes('health')) return ShieldCheck;
  return Bell;
};

/** SOUQ PLUS Phase 1 §4.10 — platform_notifications + all-store Help Chat AI. */
export const MasterNotificationsHub: React.FC<{
  onNavigateTab?: (tab: string) => void;
}> = ({ onNavigateTab }) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();
  const { stores } = useTenant();
  const [hubTab, setHubTab] = useState<HubTab>('notifications');
  const [events, setEvents] = useState<NotifyRow[]>([]);
  const [meta, setMeta] = useState<{ new?: number; source?: string; total?: number }>({});
  const [busy, setBusy] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [storeScope, setStoreScope] = useState<string>('all');
  const [storeStatus, setStoreStatus] = useState<'all' | 'active' | 'pending' | 'suspended'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const list = useAdvancedListState({
    initialPageSize: 25,
    initialSortKey: 'created',
    initialSortDir: 'desc',
    initialFilters: { status: 'all', severity: 'all', category: 'all' },
  });

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetchMasterNotifications();
      setEvents(Array.isArray(res?.data) ? res.data : []);
      setMeta(res?.meta || {});
      setSelectedIds(new Set());
    } catch {
      toast(isAr ? 'تعذر تحميل الإشعارات' : 'Failed to load notifications', 'error');
      setEvents([]);
    } finally {
      setBusy(false);
    }
  }, [isAr, toast]);

  useEffect(() => {
    if (hubTab === 'notifications') void load();
  }, [hubTab, load]);

  const resolveStoreId = useCallback(
    (ev: NotifyRow): string | null => {
      const direct = String(ev.store_id || ev.storeId || '').trim();
      if (direct) return direct;
      const ref = String(ev.source_ref || '').trim();
      if (!ref) return null;
      if (stores.some((s) => s.id === ref)) return ref;
      const m = ref.match(/store[-_]?[\w-]+/i);
      if (m && stores.some((s) => s.id === m[0])) return m[0];
      return null;
    },
    [stores],
  );

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

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    for (const ev of events) {
      const c = String(ev.category || ev.source || '').trim();
      if (c) set.add(c);
    }
    return Array.from(set).sort();
  }, [events]);

  const scopedEvents = useMemo(() => {
    return events.filter((ev) => {
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
  }, [events, storeScope, storeStatus, stores, resolveStoreId]);

  const pipe = useMemo(
    () =>
      pipelineAdvancedList({
        rows: scopedEvents,
        search: list.search,
        getSearchBlob: (row) => {
          const { title, description } = localize(row);
          const sid = resolveStoreId(row);
          const storeHit = sid ? stores.find((s) => s.id === sid) : undefined;
          const storeName = storeHit ? getStoreDisplayName(storeHit, locale) : sid || '';
          return `${title} ${description} ${row.status} ${row.severity} ${row.category} ${row.source} ${storeName}`;
        },
        filters: list.filters,
        matchFilter: (row, key, value) => {
          if (key === 'status') return String(row.status || '') === value;
          if (key === 'severity') return String(row.severity || '') === value;
          if (key === 'category') return String(row.category || row.source || '') === value;
          return true;
        },
        dateFrom: list.dateFrom,
        dateTo: list.dateTo,
        getDate: (row) => (row.created_at ? String(row.created_at) : null),
        sortKey: list.sortKey,
        sortDir: list.sortDir,
        getSortValue: (row, key) => {
          if (key === 'title') return localize(row).title;
          if (key === 'status') return String(row.status || '');
          if (key === 'severity') return String(row.severity || '');
          if (key === 'category') return String(row.category || row.source || '');
          if (key === 'store') {
            const sid = resolveStoreId(row);
            const storeHit = sid ? stores.find((s) => s.id === sid) : undefined;
            return storeHit ? getStoreDisplayName(storeHit, locale) : sid || '';
          }
          if (key === 'created') return String(row.created_at || '');
          return '';
        },
        page: list.page,
        pageSize: list.pageSize,
      }),
    // localize/isAr/locale intentional for AR/EN search+sort
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scopedEvents, list, stores, locale, isAr, resolveStoreId],
  );

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

  const markSelected = async (status: string) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setActingId(ids[0]);
    try {
      await markMasterNotifications({ ids, status });
      toast(
        isAr ? `تم تحديث ${ids.length} إشعار` : `Updated ${ids.length} notification(s)`,
        'success',
      );
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

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectPage = () => {
    const pageIds = pipe.pageRows.map((r) => String(r.id));
    const allSelected = pageIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const pageAllSelected =
    pipe.pageRows.length > 0 && pipe.pageRows.every((r) => selectedIds.has(String(r.id)));

  const columns = useMemo<AdvancedTableColumn<NotifyRow>[]>(
    () => [
      {
        key: 'select',
        header: '',
        className: 'w-10',
        render: (r) => {
          const id = String(r.id);
          return (
            <input
              type="checkbox"
              checked={selectedIds.has(id)}
              onChange={() => toggleSelect(id)}
              aria-label={isAr ? 'تحديد' : 'Select'}
              className="rounded border"
              style={{ accentColor: 'var(--accent)' }}
            />
          );
        },
      },
      {
        key: 'title',
        header: isAr ? 'الإشعار' : 'Notification',
        sortable: true,
        render: (r) => {
          const { title, description } = localize(r);
          const severity = String(r.severity || 'Informational');
          const category = String(r.category || r.source || 'system');
          const source = String(r.source || '');
          const Icon = categoryIcon(category, source);
          const sev = severityStyle(severity);
          const isNew = String(r.status || '') === 'New';
          return (
            <div className="flex items-start gap-2.5 min-w-0 max-w-md">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: sev.bg, color: sev.color }}
              >
                <Icon className="w-4 h-4" aria-hidden />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  {isNew ? (
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: 'var(--accent)' }}
                      aria-hidden
                    />
                  ) : null}
                  <span className="font-bold text-sm truncate" style={{ color: 'var(--text)' }}>
                    {title || '—'}
                  </span>
                </div>
                {description ? (
                  <p className="text-[11px] mt-0.5 line-clamp-2" style={{ color: 'var(--muted)' }}>
                    {description}
                  </p>
                ) : null}
              </div>
            </div>
          );
        },
      },
      {
        key: 'store',
        header: isAr ? 'المتجر' : 'Store',
        sortable: true,
        render: (r) => {
          const sid = resolveStoreId(r);
          const storeHit = sid ? stores.find((s) => s.id === sid) : undefined;
          const name = storeHit ? getStoreDisplayName(storeHit, locale) : sid;
          return name ? (
            <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>
              {name}
            </span>
          ) : (
            <span className="text-xs" style={{ color: 'var(--muted)' }}>
              {isAr ? 'منصة' : 'Platform'}
            </span>
          );
        },
      },
      {
        key: 'category',
        header: isAr ? 'الفئة' : 'Category',
        sortable: true,
        render: (r) => (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize"
            style={{
              background: 'color-mix(in srgb, var(--accent) 8%, transparent)',
              color: 'var(--accent)',
            }}
          >
            {String(r.category || r.source || '—')}
          </span>
        ),
      },
      {
        key: 'severity',
        header: isAr ? 'الأهمية' : 'Severity',
        sortable: true,
        render: (r) => {
          const severity = String(r.severity || 'Informational');
          const sev = severityStyle(severity);
          return (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: sev.bg, color: sev.color }}
            >
              {severityLabel(severity)}
            </span>
          );
        },
      },
      {
        key: 'status',
        header: isAr ? 'الحالة' : 'Status',
        sortable: true,
        render: (r) => (
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{
              border: '1px solid var(--border)',
              color: 'var(--muted)',
            }}
          >
            {statusLabel(String(r.status || 'New'))}
          </span>
        ),
      },
      {
        key: 'created',
        header: isAr ? 'الوقت' : 'When',
        sortable: true,
        render: (r) => (
          <span className="text-[11px] whitespace-nowrap" style={{ color: 'var(--muted)' }}>
            {r.created_at ? formatRelativeTime(String(r.created_at), locale) : '—'}
          </span>
        ),
      },
      {
        key: 'action',
        header: isAr ? 'إجراء' : 'Actions',
        render: (r) => {
          const id = String(r.id);
          const status = String(r.status || 'New');
          const actionTab = String(r.action_tab || '').trim();
          const isActing = actingId === id;
          return (
            <div className="flex flex-wrap items-center gap-1 min-w-[9rem]">
              {status === 'New' ? (
                <button
                  type="button"
                  disabled={isActing}
                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg disabled:opacity-60"
                  style={{
                    color: 'var(--accent)',
                    background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                  }}
                  onClick={() => void mark([id], 'Acknowledged')}
                  title={isAr ? 'تأكيد' : 'Acknowledge'}
                >
                  {isActing ? (
                    <Loader2 className="w-3 h-3 animate-spin" aria-hidden />
                  ) : (
                    <CheckCheck className="w-3 h-3" aria-hidden />
                  )}
                  {isAr ? 'تأكيد' : 'Ack'}
                </button>
              ) : null}
              {status !== 'In Progress' && status !== 'Archived' && status !== 'Resolved' ? (
                <button
                  type="button"
                  disabled={isActing}
                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg disabled:opacity-60"
                  style={{ color: 'var(--text)', border: '1px solid var(--border)' }}
                  onClick={() => void mark([id], 'In Progress')}
                  title={isAr ? 'قيد المعالجة' : 'In progress'}
                >
                  <AlertTriangle className="w-3 h-3" aria-hidden />
                </button>
              ) : null}
              {status !== 'Resolved' && status !== 'Archived' ? (
                <button
                  type="button"
                  disabled={isActing}
                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg disabled:opacity-60"
                  style={{
                    color: '#059669',
                    background: 'color-mix(in srgb, #059669 10%, transparent)',
                  }}
                  onClick={() => void mark([id], 'Resolved')}
                  title={isAr ? 'حل' : 'Resolve'}
                >
                  <ShieldCheck className="w-3 h-3" aria-hidden />
                </button>
              ) : null}
              {status !== 'Archived' ? (
                <button
                  type="button"
                  disabled={isActing}
                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg disabled:opacity-60"
                  style={{ color: 'var(--muted)', border: '1px solid var(--border)' }}
                  onClick={() => void mark([id], 'Archived')}
                  title={isAr ? 'أرشفة' : 'Archive'}
                >
                  <Archive className="w-3 h-3" aria-hidden />
                </button>
              ) : null}
              {actionTab && onNavigateTab ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-1 rounded-lg"
                  style={{
                    color: 'var(--portal-cta)',
                    background: 'color-mix(in srgb, var(--portal-cta) 10%, transparent)',
                  }}
                  onClick={() => {
                    if (actionTab === 'support') setHubTab('help');
                    else onNavigateTab(actionTab);
                  }}
                >
                  {isAr ? 'فتح' : 'Open'}
                  <ArrowRight className="w-3 h-3 rtl:rotate-180" aria-hidden />
                </button>
              ) : null}
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isAr, locale, stores, selectedIds, actingId, onNavigateTab, resolveStoreId],
  );

  const filterActiveCount =
    list.activeFilterCount +
    (storeScope !== 'all' ? 1 : 0) +
    (storeStatus !== 'all' ? 1 : 0);

  return (
    <AdminPageShell>
      <AdminPageHeader
        title={isAr ? 'مركز الإشعارات والمساعدة' : 'Notifications & Help Center'}
        subtitle={
          isAr
            ? 'جدول متقدم للإشعارات — ومساعدة جميع المتاجر مع الرد بالذكاء الاصطناعي'
            : 'Advanced notifications table — plus all-store help with AI replies'
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
          hubTab === 'notifications' ? (
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
          ) : null
        }
      />

      <MasterTabPills
        className="mt-4"
        active={hubTab}
        onChange={(id) => setHubTab(id as HubTab)}
        tabs={[
          {
            id: 'notifications',
            label: isAr ? `الإشعارات (${events.length})` : `Notifications (${events.length})`,
          },
          {
            id: 'help',
            label: isAr ? 'مساعدة المتاجر + ذكاء اصطناعي' : 'Store Help + AI',
          },
        ]}
      />

      {hubTab === 'help' ? (
        <div className="mt-4">
          <MasterLuxePanel className="mb-3" padding="md">
            <div className="flex items-start gap-2.5">
              <Headphones className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--accent)' }} aria-hidden />
              <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                {isAr
                  ? 'كل طلبات المساعدة من جميع المتاجر تظهر هنا. افتح المحادثة للرد يدوياً أو استخدم مسودة/إرسال الذكاء الاصطناعي.'
                  : 'Help requests from every store appear here. Open a thread to reply manually or draft/send with AI.'}
              </p>
            </div>
          </MasterLuxePanel>
          <MasterHelpChatInbox />
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-col gap-3">
            <MasterStoreScopeFilter
              value={storeScope}
              onChange={(id) => {
                setStoreScope(id);
                list.setPage(1);
              }}
              statusFilter={storeStatus}
              onStatusFilterChange={(s) => {
                setStoreStatus(s);
                list.setPage(1);
              }}
              showStatusChips
            />
          </div>

          <div className="mt-4">
            <AdvancedDataTable
              rows={pipe.pageRows}
              columns={columns}
              rowKey={(row) => String(row.id)}
              search={list.search}
              onSearchChange={list.setSearch}
              searchPlaceholder={
                isAr ? 'بحث في العنوان، الوصف، المتجر، الفئة…' : 'Search title, description, store, category…'
              }
              sortKey={list.sortKey}
              sortDir={list.sortDir}
              onSort={list.onSort}
              page={pipe.safePage}
              pageSize={list.pageSize}
              onPageChange={list.setPage}
              onPageSizeChange={list.setPageSize}
              total={pipe.total}
              loading={busy && events.length === 0}
              emptyMessage={
                events.length === 0
                  ? isAr
                    ? 'لا توجد سجلات'
                    : 'No records found'
                  : isAr
                    ? 'لا نتائج للفلاتر الحالية'
                    : 'No results for current filters'
              }
              pageSizeOptions={[10, 25, 50, 100]}
              toolbarRight={
                selectedIds.size > 0 ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold" style={{ color: 'var(--muted)' }}>
                      {selectedIds.size} {isAr ? 'محدد' : 'selected'}
                    </span>
                    <button
                      type="button"
                      className={masterGhostBtnClass}
                      disabled={!!actingId}
                      onClick={() => void markSelected('Acknowledged')}
                    >
                      <CheckCheck className="w-3.5 h-3.5" aria-hidden />
                      {isAr ? 'تأكيد' : 'Acknowledge'}
                    </button>
                    <button
                      type="button"
                      className={masterGhostBtnClass}
                      disabled={!!actingId}
                      onClick={() => void markSelected('In Progress')}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" aria-hidden />
                      {isAr ? 'قيد المعالجة' : 'In progress'}
                    </button>
                    <button
                      type="button"
                      className={masterGhostBtnClass}
                      disabled={!!actingId}
                      onClick={() => void markSelected('Resolved')}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" aria-hidden />
                      {isAr ? 'حل' : 'Resolve'}
                    </button>
                    <button
                      type="button"
                      className={masterGhostBtnClass}
                      disabled={!!actingId}
                      onClick={() => void markSelected('Archived')}
                    >
                      <Archive className="w-3.5 h-3.5" aria-hidden />
                      {isAr ? 'أرشفة' : 'Archive'}
                    </button>
                  </div>
                ) : (
                  <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pageAllSelected}
                      onChange={toggleSelectPage}
                      style={{ accentColor: 'var(--accent)' }}
                    />
                    {isAr ? 'تحديد الصفحة' : 'Select page'}
                  </label>
                )
              }
              filters={
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
                  filterValues={list.filters}
                  onFilterChange={list.setFilter}
                  dateFrom={list.dateFrom}
                  dateTo={list.dateTo}
                  onDateFromChange={list.setDateFrom}
                  onDateToChange={list.setDateTo}
                  showDates
                  activeCount={filterActiveCount}
                  onReset={() => {
                    list.resetAll();
                    setStoreScope('all');
                    setStoreStatus('all');
                    setSelectedIds(new Set());
                  }}
                />
              }
            />
          </div>

          <MasterMetaLine className="mt-3">
            {isAr ? 'المصدر' : 'Source'}: {meta.source || 'platform_notifications'} ·{' '}
            {isAr ? 'المعروض' : 'Showing'} {pipe.total}/{events.length}
            {typeof meta.total === 'number' ? ` · ${isAr ? 'الإجمالي' : 'Total'} ${meta.total}` : ''}
          </MasterMetaLine>
        </>
      )}
    </AdminPageShell>
  );
};
