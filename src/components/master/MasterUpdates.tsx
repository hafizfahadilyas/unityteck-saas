import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminPageShell, AdminPageHeader } from '../common/AdminPageHeader';
import { AdvancedFilterBar } from '../common/AdvancedFilterBar';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import { useTenant } from '../../context/TenantContext';
import { fetchMasterUpdates, patchMasterUpdate } from '../../api/tenantApi';
import { GitBranch, RefreshCw, CheckCircle, RotateCcw, Store } from 'lucide-react';
import { MasterLuxePanel, MasterMetaLine, masterGhostBtnClass } from './MasterUiKit';
import { getStoreDisplayName } from '../../utils/storeLocalization';

type UpdateRow = {
  id: string;
  version: string;
  type: string;
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  status: string;
  deployed_store_ids: string[];
  released_at?: string | null;
};

/** Master Updates — real MySQL platform_updates + advanced filters + per-store rollout. */
export const MasterUpdates: React.FC = () => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();
  const { stores } = useTenant();
  const [rows, setRows] = useState<UpdateRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [acting, setActing] = useState(false);
  const [activeId, setActiveId] = useState('');
  const [filters, setFilters] = useState({ type: 'all', status: 'all' });
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [storeQuery, setStoreQuery] = useState('');

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetchMasterUpdates();
      const list = (Array.isArray(res?.data) ? res.data : []).map((r) => ({
        id: String(r.id || ''),
        version: String(r.version || ''),
        type: String(r.type || 'core'),
        title_en: String(r.title_en || r.title || ''),
        title_ar: String(r.title_ar || ''),
        description_en: String(r.description_en || r.description || ''),
        description_ar: String(r.description_ar || ''),
        status: String(r.status || 'draft'),
        deployed_store_ids: Array.isArray(r.deployed_store_ids)
          ? (r.deployed_store_ids as string[]).map(String)
          : [],
        released_at: r.released_at ? String(r.released_at) : null,
      }));
      setRows(list);
      setActiveId((prev) => prev || list[0]?.id || '');
    } catch {
      toast(isAr ? 'تعذر تحميل التحديثات' : 'Failed to load updates', 'error');
      setRows([]);
    } finally {
      setBusy(false);
    }
  }, [isAr, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const fromTs = dateFrom ? Date.parse(`${dateFrom}T00:00:00`) : NaN;
    const toTs = dateTo ? Date.parse(`${dateTo}T23:59:59`) : NaN;
    return rows.filter((u) => {
      if (filters.type !== 'all' && u.type !== filters.type) return false;
      if (filters.status !== 'all' && u.status !== filters.status) return false;
      const released = u.released_at ? Date.parse(u.released_at) : NaN;
      if (!Number.isNaN(fromTs) && !Number.isNaN(released) && released < fromTs) return false;
      if (!Number.isNaN(toTs) && !Number.isNaN(released) && released > toTs) return false;
      return true;
    });
  }, [rows, filters, dateFrom, dateTo]);

  const selected = filtered.find((u) => u.id === activeId) || filtered[0] || null;

  useEffect(() => {
    if (selected && selected.id !== activeId) setActiveId(selected.id);
  }, [selected, activeId]);

  const activeFilterCount =
    (filters.type !== 'all' ? 1 : 0) +
    (filters.status !== 'all' ? 1 : 0) +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0);

  const titleOf = (u: UpdateRow) => (isAr && u.title_ar ? u.title_ar : u.title_en);
  const descOf = (u: UpdateRow) => (isAr && u.description_ar ? u.description_ar : u.description_en);

  const statusLabel = (s: string) => {
    if (!isAr) {
      if (s === 'approved') return 'Approved';
      if (s === 'rolled_back') return 'Rolled back';
      return 'Draft';
    }
    if (s === 'approved') return 'معتمد';
    if (s === 'rolled_back') return 'تم التراجع';
    return 'مسودة';
  };

  const patch = async (id: string, payload: Record<string, unknown>) => {
    setActing(true);
    try {
      await patchMasterUpdate(id, payload);
      toast(isAr ? 'تم تحديث الإصدار' : 'Release updated', 'success');
      await load();
    } catch {
      toast(isAr ? 'فشل التحديث' : 'Update failed', 'error');
    } finally {
      setActing(false);
    }
  };

  const storeMatches = (name: string, id: string) => {
    const q = storeQuery.trim().toLowerCase();
    if (!q) return true;
    return name.toLowerCase().includes(q) || id.toLowerCase().includes(q);
  };

  return (
    <AdminPageShell>
      <AdminPageHeader
        title={isAr ? 'التحديثات والطرح' : 'Updates & Rollout'}
        subtitle={
          isAr
            ? 'إصدارات محفوظة في قاعدة البيانات — فلترة متقدمة وطرح لكل متجر'
            : 'Persisted MySQL releases — advanced filters and per-store rollout'
        }
        badge={
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg"
            style={{
              background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
              color: 'var(--accent)',
            }}
          >
            <GitBranch className="w-3.5 h-3.5" aria-hidden />
            {rows.length} {isAr ? 'إصدار' : 'releases'}
          </span>
        }
        actions={
          <button type="button" className={masterGhostBtnClass} onClick={() => void load()} disabled={busy}>
            <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} aria-hidden />
            {isAr ? 'تحديث' : 'Refresh'}
          </button>
        }
      />

      <div className="mt-4">
        <AdvancedFilterBar
          fields={[
            {
              key: 'type',
              label: isAr ? 'النوع' : 'Type',
              options: [
                { value: 'all', label: isAr ? 'كل الأنواع' : 'All types' },
                { value: 'core', label: isAr ? 'النواة' : 'Core' },
                { value: 'theme', label: isAr ? 'السمات' : 'Theme' },
                { value: 'plugin', label: isAr ? 'الإضافات' : 'Plugin' },
                { value: 'security', label: isAr ? 'الأمان' : 'Security' },
              ],
            },
            {
              key: 'status',
              label: isAr ? 'الحالة' : 'Status',
              options: [
                { value: 'all', label: isAr ? 'كل الحالات' : 'All statuses' },
                { value: 'draft', label: isAr ? 'مسودة' : 'Draft' },
                { value: 'approved', label: isAr ? 'معتمد' : 'Approved' },
                { value: 'rolled_back', label: isAr ? 'تم التراجع' : 'Rolled back' },
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
            setFilters({ type: 'all', status: 'all' });
            setDateFrom('');
            setDateTo('');
            setStoreQuery('');
          }}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 space-y-2">
          {busy && rows.length === 0 ? (
            <MasterLuxePanel padding="lg">
              <p className="text-center text-sm" style={{ color: 'var(--muted)' }}>
                {isAr ? 'جاري التحميل…' : 'Loading…'}
              </p>
            </MasterLuxePanel>
          ) : filtered.length === 0 ? (
            <MasterLuxePanel padding="lg">
              <p className="text-center text-sm" style={{ color: 'var(--muted)' }}>
                {rows.length === 0
                  ? isAr
                    ? 'لا توجد سجلات'
                    : 'No records found'
                  : isAr
                    ? 'لا نتائج للفلاتر الحالية'
                    : 'No results for current filters'}
              </p>
            </MasterLuxePanel>
          ) : (
            filtered.map((rel) => {
              const on = selected?.id === rel.id;
              return (
                <button
                  key={rel.id}
                  type="button"
                  onClick={() => setActiveId(rel.id)}
                  className="w-full text-start p-4 rounded-2xl border transition-all"
                  style={{
                    background: on
                      ? 'color-mix(in srgb, var(--accent) 10%, var(--surface))'
                      : 'var(--surface)',
                    borderColor: on
                      ? 'color-mix(in srgb, var(--accent) 40%, var(--border))'
                      : 'var(--border)',
                    color: 'var(--text)',
                    boxShadow: on ? '0 0 0 1px color-mix(in srgb, var(--accent) 20%, transparent)' : undefined,
                  }}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span
                      className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                        color: 'var(--accent)',
                      }}
                    >
                      {rel.version} · {rel.type.toUpperCase()}
                    </span>
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background:
                          rel.status === 'approved'
                            ? 'color-mix(in srgb, #10b981 14%, transparent)'
                            : rel.status === 'rolled_back'
                              ? 'color-mix(in srgb, #e11d48 12%, transparent)'
                              : 'color-mix(in srgb, #d97706 12%, transparent)',
                        color:
                          rel.status === 'approved'
                            ? '#059669'
                            : rel.status === 'rolled_back'
                              ? '#be123c'
                              : '#b45309',
                      }}
                    >
                      {statusLabel(rel.status)}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                    {titleOf(rel)}
                  </h3>
                  <p className="text-[11px] mt-1 line-clamp-2" style={{ color: 'var(--muted)' }}>
                    {descOf(rel)}
                  </p>
                  <p className="text-[11px] mt-2" style={{ color: 'var(--muted)' }}>
                    {isAr ? 'مطروح على' : 'Deployed to'}: {rel.deployed_store_ids.length}/{stores.length}{' '}
                    {isAr ? 'متجر' : 'stores'}
                  </p>
                </button>
              );
            })
          )}
        </div>

        <MasterLuxePanel className="lg:col-span-7 space-y-4" padding="lg">
          {!selected ? (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              {isAr ? 'اختر إصداراً' : 'Select a release'}
            </p>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="font-mono text-xs font-bold px-2 py-0.5 rounded"
                      style={{
                        background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                        color: 'var(--accent)',
                      }}
                    >
                      {selected.version}
                    </span>
                    <h2 className="text-base font-black" style={{ color: 'var(--text)' }}>
                      {titleOf(selected)}
                    </h2>
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                    {descOf(selected)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={acting || selected.status === 'rolled_back'}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 disabled:opacity-50"
                    style={{
                      background: 'color-mix(in srgb, #e11d48 10%, var(--surface))',
                      color: '#be123c',
                      border: '1px solid color-mix(in srgb, #e11d48 25%, var(--border))',
                    }}
                    onClick={() => void patch(selected.id, { status: 'rolled_back' })}
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden />
                    {isAr ? 'تراجع' : 'Rollback'}
                  </button>
                  <button
                    type="button"
                    disabled={acting || selected.status === 'approved'}
                    className="unity-btn-primary text-xs inline-flex items-center gap-1 disabled:opacity-50"
                    onClick={() => void patch(selected.id, { status: 'approved' })}
                  >
                    <CheckCircle className="w-3.5 h-3.5" aria-hidden />
                    {isAr ? 'اعتماد' : 'Approve'}
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <p className="text-xs font-bold inline-flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                  <Store className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} aria-hidden />
                  {isAr ? 'طرح لكل متجر' : 'Per-store rollout'}
                </p>
                <input
                  type="search"
                  value={storeQuery}
                  onChange={(e) => setStoreQuery(e.target.value)}
                  placeholder={isAr ? 'بحث عن متجر…' : 'Search stores…'}
                  className="text-xs px-3 py-1.5 rounded-xl border w-full sm:w-56"
                  style={{
                    background: 'var(--surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                  }}
                />
              </div>

              <ul className="divide-y max-h-[420px] overflow-y-auto rounded-xl border" style={{ borderColor: 'var(--border)' }}>
                {stores.length === 0 ? (
                  <li className="p-6 text-center text-sm" style={{ color: 'var(--muted)' }}>
                    {isAr ? 'لا توجد متاجر' : 'No stores found'}
                  </li>
                ) : (
                  stores
                    .filter((s) => storeMatches(getStoreDisplayName(s, locale), s.id))
                    .map((s) => {
                      const on = selected.deployed_store_ids.includes(s.id);
                      const name = getStoreDisplayName(s, locale);
                      return (
                        <li
                          key={s.id}
                          className="flex items-center justify-between gap-3 p-3"
                          style={{ borderColor: 'var(--border)' }}
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-bold truncate" style={{ color: 'var(--text)' }}>
                              {name}
                            </p>
                            <p className="text-[11px] truncate" style={{ color: 'var(--muted)' }}>
                              {s.id} · {s.status}
                            </p>
                          </div>
                          <button
                            type="button"
                            disabled={acting}
                            className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg disabled:opacity-50"
                            style={{
                              background: on
                                ? 'color-mix(in srgb, var(--accent) 14%, transparent)'
                                : 'var(--surface)',
                              color: on ? 'var(--accent)' : 'var(--muted)',
                              border: `1px solid ${on ? 'color-mix(in srgb, var(--accent) 30%, var(--border))' : 'var(--border)'}`,
                            }}
                            onClick={() => void patch(selected.id, { toggle_store_id: s.id })}
                          >
                            {on ? (isAr ? 'مفعّل' : 'On') : isAr ? 'متوقف' : 'Off'}
                          </button>
                        </li>
                      );
                    })
                )}
              </ul>
            </>
          )}
        </MasterLuxePanel>
      </div>

      <MasterMetaLine className="mt-3">
        {isAr ? 'المصدر' : 'Source'}: platform_updates · {isAr ? 'المعروض' : 'Showing'}{' '}
        {filtered.length}/{rows.length}
      </MasterMetaLine>
    </AdminPageShell>
  );
};
