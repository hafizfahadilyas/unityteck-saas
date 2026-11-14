import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminPageShell, AdminPageHeader } from '../common/AdminPageHeader';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import { useTenant } from '../../context/TenantContext';
import {
  adjustMasterPoints,
  createMasterService,
  fetchMasterPointTransactions,
  fetchMasterServices,
  patchMasterService,
} from '../../api/tenantApi';
import { Coins, Plus, RefreshCw, CheckCircle, Ban, Pencil, Activity } from 'lucide-react';
import { GlobalModal } from '../common/GlobalModal';
import { OverviewStatCard } from '../common/OverviewStatCard';
import { MasterKpiGrid, MasterLuxePanel, MasterMetaLine, MasterTabPills, masterGhostBtnClass } from './MasterUiKit';
import { MasterStoreScopeFilter } from './MasterStoreScopeFilter';
import { AdvancedDataTable, type AdvancedTableColumn } from '../common/AdvancedDataTable';
import { AdvancedFilterBar } from '../common/AdvancedFilterBar';
import { pipelineAdvancedList, useAdvancedListState } from '../../hooks/useAdvancedListState';

/** SOUQ PLUS Phase 1 §4.5 — platform service units (not cash). */
export const MasterServicesPoints: React.FC = () => {
  const { locale, amount } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();
  const { stores } = useTenant();
  const [tab, setTab] = useState<'services' | 'ledger'>('services');
  const [services, setServices] = useState<Array<Record<string, unknown>>>([]);
  const [svcMeta, setSvcMeta] = useState<{ total?: number; source?: string }>({});
  const [tx, setTx] = useState<Array<Record<string, unknown>>>([]);
  const [txMeta, setTxMeta] = useState<{ total?: number; source?: string }>({});
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [cost, setCost] = useState(1);
  const [dailyLimit, setDailyLimit] = useState<string>('');
  const [monthlyLimit, setMonthlyLimit] = useState<string>('');
  const [ledgerStore, setLedgerStore] = useState<string>('all');
  const [ledgerStoreStatus, setLedgerStoreStatus] = useState<'all' | 'active' | 'pending' | 'suspended'>('all');
  const [adjStore, setAdjStore] = useState('');
  const [adjPoints, setAdjPoints] = useState(10);
  const [adjType, setAdjType] = useState<'grant' | 'deduction'>('grant');
  const [adjReason, setAdjReason] = useState('');
  const [editRow, setEditRow] = useState<Record<string, unknown> | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const svcList = useAdvancedListState({
    initialPageSize: 10,
    initialSortKey: 'name',
    initialSortDir: 'asc',
    initialFilters: { status: 'all', category: 'all' },
  });

  const svcStats = useMemo(() => {
    const active = services.filter((s) => String(s.status) === 'active').length;
    const inactive = services.filter((s) => String(s.status) === 'inactive').length;
    return { total: services.length, active, inactive };
  }, [services]);

  const txStats = useMemo(() => {
    const grants = tx.filter((r) => String(r.type) === 'grant');
    const deductions = tx.filter((r) => String(r.type) === 'deduction');
    const grantPts = grants.reduce((n, r) => n + (Number(r.points) || 0), 0);
    const deductPts = deductions.reduce((n, r) => n + (Number(r.points) || 0), 0);
    const scoped =
      ledgerStore === 'all'
        ? tx
        : tx.filter((r) => String(r.store_id || '') === ledgerStore);
    return {
      rows: tx.length,
      grantPts,
      deductPts,
      net: grantPts - deductPts,
      scopedCount: scoped.length,
    };
  }, [tx, ledgerStore]);

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    for (const s of services) {
      const c = String(s.category || 'general').trim();
      if (c) set.add(c);
    }
    return Array.from(set).sort();
  }, [services]);
  const txList = useAdvancedListState({
    initialPageSize: 10,
    initialSortKey: 'created',
    initialSortDir: 'desc',
    initialFilters: { type: 'all' },
  });

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const [s, t] = await Promise.all([fetchMasterServices(), fetchMasterPointTransactions()]);
      setServices(Array.isArray(s?.data) ? s.data : []);
      setSvcMeta(s?.meta || {});
      setTx(Array.isArray(t?.data) ? t.data : []);
      setTxMeta(t?.meta || {});
    } catch {
      toast(isAr ? 'تعذر التحميل' : 'Failed to load', 'error');
      setServices([]);
      setTx([]);
    } finally {
      setBusy(false);
    }
  }, [isAr, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const addService = async () => {
    if (!name.trim()) {
      toast(isAr ? 'اسم الخدمة مطلوب' : 'Service name required', 'error');
      return;
    }
    try {
      await createMasterService({
        name: name.trim(),
        name_ar: nameAr.trim() || undefined,
        description: description.trim() || undefined,
        category: category.trim() || 'general',
        point_cost: cost,
        status: 'active',
        daily_limit: dailyLimit.trim() ? Number(dailyLimit) : undefined,
        monthly_limit: monthlyLimit.trim() ? Number(monthlyLimit) : undefined,
      });
      setName('');
      setNameAr('');
      setDescription('');
      setDailyLimit('');
      setMonthlyLimit('');
      toast(isAr ? 'تمت إضافة الخدمة' : 'Service added', 'success');
      await load();
    } catch {
      toast(isAr ? 'فشل الحفظ' : 'Save failed', 'error');
    }
  };

  const toggleService = async (id: string, status: string) => {
    try {
      await patchMasterService(id, { status: status === 'active' ? 'inactive' : 'active' });
      await load();
    } catch {
      toast(isAr ? 'فشل التحديث' : 'Update failed', 'error');
    }
  };

  const adjust = async () => {
    if (!adjReason.trim() || !adjPoints) {
      toast(isAr ? 'النقاط والسبب مطلوبان' : 'Points and reason required', 'error');
      return;
    }
    try {
      await adjustMasterPoints({
        type: adjType,
        points: adjPoints,
        reason: adjReason.trim(),
        store_id: adjStore.trim() || undefined,
        reference: `adj-${Date.now()}`,
      });
      setAdjReason('');
      toast(isAr ? 'تم تسجيل الحركة' : 'Transaction recorded', 'success');
      await load();
    } catch {
      toast(isAr ? 'فشل التعديل' : 'Adjust failed', 'error');
    }
  };

  const svcPipe = useMemo(
    () =>
      pipelineAdvancedList({
        rows: services,
        search: svcList.search,
        getSearchBlob: (row) => `${row.name} ${row.name_ar} ${row.status} ${row.point_cost}`,
        filters: svcList.filters,
        matchFilter: (row, key, value) => {
          if (key === 'status' && value !== 'all') return String(row.status || '') === value;
          if (key === 'category' && value !== 'all') return String(row.category || 'general') === value;
          return true;
        },
        sortKey: svcList.sortKey,
        sortDir: svcList.sortDir,
        getSortValue: (row, key) => {
          if (key === 'name') return String(isAr && row.name_ar ? row.name_ar : row.name || '');
          if (key === 'cost') return Number(row.point_cost) || 0;
          if (key === 'status') return String(row.status || '');
          return '';
        },
        page: svcList.page,
        pageSize: svcList.pageSize,
      }),
    [services, svcList, isAr],
  );

  const scopedTx = useMemo(() => {
    if (ledgerStore === 'all') return tx;
    return tx.filter((r) => String(r.store_id || '') === ledgerStore);
  }, [tx, ledgerStore]);

  const saveEdit = async () => {
    if (!editRow?.id) return;
    setEditSaving(true);
    try {
      await patchMasterService(String(editRow.id), {
        name: String(editRow.name || '').trim(),
        name_ar: String(editRow.name_ar || '').trim() || undefined,
        point_cost: Number(editRow.point_cost) || 0,
        status: String(editRow.status || 'active'),
        category: String(editRow.category || 'general'),
        description: String(editRow.description || '').trim() || undefined,
      });
      toast(isAr ? 'تم التحديث' : 'Updated', 'success');
      setEditRow(null);
      await load();
    } catch {
      toast(isAr ? 'فشل التحديث' : 'Update failed', 'error');
    } finally {
      setEditSaving(false);
    }
  };

  const txPipe = useMemo(
    () =>
      pipelineAdvancedList({
        rows: scopedTx,
        search: txList.search,
        getSearchBlob: (row) => `${row.type} ${row.points} ${row.store_id} ${row.reason}`,
        filters: txList.filters,
        matchFilter: (row, key, value) => {
          if (key === 'type') return String(row.type || '') === value;
          return true;
        },
        dateFrom: txList.dateFrom,
        dateTo: txList.dateTo,
        getDate: (row) => (row.created_at ? String(row.created_at) : null),
        sortKey: txList.sortKey,
        sortDir: txList.sortDir,
        getSortValue: (row, key) => {
          if (key === 'type') return String(row.type || '');
          if (key === 'points') return Number(row.points) || 0;
          if (key === 'store') return String(row.store_id || '');
          if (key === 'created') return String(row.created_at || '');
          return '';
        },
        page: txList.page,
        pageSize: txList.pageSize,
      }),
    [scopedTx, txList],
  );

  const svcColumns = useMemo<AdvancedTableColumn<Record<string, unknown>>[]>(
    () => [
      {
        key: 'name',
        header: isAr ? 'الخدمة' : 'Service',
        sortable: true,
        render: (row) => (
          <span className="font-bold">
            {isAr && row.name_ar ? String(row.name_ar) : String(row.name)}
          </span>
        ),
      },
      {
        key: 'cost',
        header: isAr ? 'النقاط' : 'Points',
        sortable: true,
        render: (row) => (
          <span style={{ color: 'var(--muted)' }}>
            {String(row.point_cost)} {isAr ? 'نقطة' : 'pts'}
          </span>
        ),
      },
      {
        key: 'category',
        header: isAr ? 'التصنيف' : 'Category',
        render: (row) => (
          <span className="text-xs capitalize" style={{ color: 'var(--muted)' }}>
            {String(row.category || 'general')}
          </span>
        ),
      },
      {
        key: 'status',
        header: isAr ? 'الحالة' : 'Status',
        sortable: true,
        render: (row) => String(row.status),
      },
      {
        key: 'action',
        header: isAr ? 'إجراء' : 'Action',
        render: (row) => (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="text-xs font-bold inline-flex items-center gap-0.5"
              style={{ color: 'var(--accent)' }}
              onClick={() => setEditRow({ ...row })}
            >
              <Pencil className="w-3 h-3" aria-hidden />
              {isAr ? 'تعديل' : 'Edit'}
            </button>
            <button
              type="button"
              className="text-xs font-bold"
              style={{ color: 'var(--accent)' }}
              onClick={() => void toggleService(String(row.id), String(row.status))}
            >
              {String(row.status) === 'active'
                ? isAr
                  ? 'إيقاف'
                  : 'Deactivate'
                : isAr
                  ? 'تفعيل'
                  : 'Activate'}
            </button>
          </div>
        ),
      },
    ],
    [isAr],
  );

  const txColumns = useMemo<AdvancedTableColumn<Record<string, unknown>>[]>(
    () => [
      {
        key: 'type',
        header: isAr ? 'النوع' : 'Type',
        sortable: true,
        render: (row) => <span className="font-bold">{String(row.type)}</span>,
      },
      {
        key: 'points',
        header: isAr ? 'النقاط' : 'Points',
        sortable: true,
        render: (row) => String(row.points),
      },
      {
        key: 'store',
        header: isAr ? 'المتجر' : 'Store',
        sortable: true,
        render: (row) => (
          <span style={{ color: 'var(--muted)' }}>{String(row.store_id || 'platform')}</span>
        ),
      },
      {
        key: 'reason',
        header: isAr ? 'السبب' : 'Reason',
        render: (row) => (
          <span className="line-clamp-2" style={{ color: 'var(--muted)' }}>
            {String(row.reason || '—')}
          </span>
        ),
      },
      {
        key: 'created',
        header: isAr ? 'التاريخ' : 'Date',
        sortable: true,
        render: (row) => (
          <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
            {row.created_at ? String(row.created_at).slice(0, 19).replace('T', ' ') : '—'}
          </span>
        ),
      },
    ],
    [isAr],
  );

  const fieldStyle: React.CSSProperties = {
    borderColor: 'var(--border)',
    color: 'var(--text)',
    background: 'var(--bg)',
    fontFamily: 'var(--font-ui)',
  };

  return (
    <AdminPageShell>
      <AdminPageHeader
        title={isAr ? 'الخدمات والنقاط' : 'Services & Points'}
        subtitle={
          isAr
            ? 'وحدات استخدام الخدمات — ليست محفظة نقدية'
            : 'Service usage units — not a cash wallet'
        }
        badge={
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg" style={{ color: 'var(--accent)' }}>
            <Coins className="w-3.5 h-3.5 inline me-1" aria-hidden />
            {services.length} {isAr ? 'خدمات' : 'services'}
          </span>
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

      <MasterMetaLine>
        {isAr ? 'المصدر' : 'Source'}: {tab === 'services' ? svcMeta.source || 'platform_services' : txMeta.source || 'platform_point_transactions'} ·{' '}
        {isAr ? 'متاجر المنصة' : 'Platform stores'}: {amount(stores.length)}
      </MasterMetaLine>

      <MasterKpiGrid className="mt-3" cols={4}>
        {tab === 'services' ? (
          <>
            <OverviewStatCard
              label={isAr ? 'إجمالي الخدمات' : 'Total services'}
              value={amount(svcStats.total)}
              icon={Coins}
              tone="accent"
            />
            <OverviewStatCard
              label={isAr ? 'خدمات نشطة' : 'Active'}
              value={amount(svcStats.active)}
              icon={CheckCircle}
              tone="success"
            />
            <OverviewStatCard
              label={isAr ? 'غير نشطة' : 'Inactive'}
              value={amount(svcStats.inactive)}
              icon={Ban}
              tone="danger"
            />
            <OverviewStatCard
              label={isAr ? 'سجل النقاط' : 'Ledger rows'}
              value={amount(txStats.rows)}
              icon={Activity}
              tone="info"
              footer={
                <button
                  type="button"
                  className="text-[10px] font-bold underline"
                  style={{ color: 'var(--accent)' }}
                  onClick={() => setTab('ledger')}
                >
                  {isAr ? 'فتح السجل' : 'Open ledger'}
                </button>
              }
            />
          </>
        ) : (
          <>
            <OverviewStatCard
              label={isAr ? 'حركات السجل' : 'Ledger rows'}
              value={amount(txStats.rows)}
              icon={Activity}
              tone="accent"
            />
            <OverviewStatCard
              label={isAr ? 'نقاط ممنوحة' : 'Points granted'}
              value={amount(txStats.grantPts)}
              icon={CheckCircle}
              tone="success"
            />
            <OverviewStatCard
              label={isAr ? 'نقاط مخصومة' : 'Points deducted'}
              value={amount(txStats.deductPts)}
              icon={Ban}
              tone="warn"
            />
            <OverviewStatCard
              label={isAr ? 'صافي النقاط' : 'Net points'}
              value={amount(txStats.net)}
              icon={Coins}
              tone="info"
              footer={
                <span className="text-[10px]" style={{ color: 'var(--muted)' }}>
                  {ledgerStore === 'all'
                    ? isAr
                      ? 'جميع المتاجر'
                      : 'All stores'
                    : `${isAr ? 'متجر' : 'Store'}: ${ledgerStore}`}
                </span>
              }
            />
          </>
        )}
      </MasterKpiGrid>

      <MasterTabPills
        className="mt-4"
        active={tab}
        onChange={(id) => setTab(id as 'services' | 'ledger')}
        tabs={[
          { id: 'services', label: isAr ? 'الخدمات' : 'Services' },
          { id: 'ledger', label: isAr ? 'سجل النقاط' : 'Point ledger' },
        ]}
      />

      {tab === 'services' ? (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4 min-w-0">
          <MasterLuxePanel className="space-y-3 lg:col-span-1 min-w-0" padding="lg">
            <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
              {isAr ? 'إضافة خدمة' : 'Add service'}
            </p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isAr ? 'الاسم (إنجليزي)' : 'Name (EN)'}
              className="w-full rounded-xl border text-sm px-3 py-2"
              style={fieldStyle}
            />
            <input
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              placeholder={isAr ? 'الاسم (عربي)' : 'Name (AR)'}
              className="w-full rounded-xl border text-sm px-3 py-2"
              style={fieldStyle}
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder={isAr ? 'وصف مختصر' : 'Short description'}
              className="w-full rounded-xl border text-sm px-3 py-2"
              style={fieldStyle}
            />
            <label className="text-xs block" style={{ color: 'var(--muted)' }}>
              {isAr ? 'التصنيف' : 'Category'}
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded-xl border text-sm px-3 py-2"
                style={fieldStyle}
              >
                {['general', 'messaging', 'ai', 'seo', 'media', 'analytics'].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs block" style={{ color: 'var(--muted)' }}>
              {isAr ? 'تكلفة النقاط لكل استخدام' : 'Point cost per use'}
              <input
                type="number"
                min={0}
                value={cost}
                onChange={(e) => setCost(Number(e.target.value) || 0)}
                className="mt-1 w-full rounded-xl border text-sm px-3 py-2"
                style={fieldStyle}
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs block" style={{ color: 'var(--muted)' }}>
                {isAr ? 'حد يومي' : 'Daily limit'}
                <input
                  type="number"
                  min={0}
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(e.target.value)}
                  placeholder="—"
                  className="mt-1 w-full rounded-xl border text-sm px-3 py-2"
                  style={fieldStyle}
                />
              </label>
              <label className="text-xs block" style={{ color: 'var(--muted)' }}>
                {isAr ? 'حد شهري' : 'Monthly limit'}
                <input
                  type="number"
                  min={0}
                  value={monthlyLimit}
                  onChange={(e) => setMonthlyLimit(e.target.value)}
                  placeholder="—"
                  className="mt-1 w-full rounded-xl border text-sm px-3 py-2"
                  style={fieldStyle}
                />
              </label>
            </div>
            <button
              type="button"
              className="unity-btn-primary text-sm inline-flex items-center gap-1.5 w-full sm:w-auto justify-center"
              onClick={() => void addService()}
            >
              <Plus className="w-3.5 h-3.5" aria-hidden />
              {isAr ? 'حفظ' : 'Save'}
            </button>
          </MasterLuxePanel>
          <div className="lg:col-span-2 min-w-0">
            <AdvancedDataTable
              rows={svcPipe.pageRows}
              columns={svcColumns}
              rowKey={(row) => String(row.id)}
              search={svcList.search}
              onSearchChange={svcList.setSearch}
              searchPlaceholder={isAr ? 'بحث في الخدمات…' : 'Search services…'}
              sortKey={svcList.sortKey}
              sortDir={svcList.sortDir}
              onSort={svcList.onSort}
              page={svcPipe.safePage}
              pageSize={svcList.pageSize}
              onPageChange={svcList.setPage}
              onPageSizeChange={svcList.setPageSize}
              total={svcPipe.total}
              loading={busy && services.length === 0}
              emptyMessage={isAr ? 'لا توجد سجلات' : 'No records found'}
              filters={
                <AdvancedFilterBar
                  showDates={false}
                  filterValues={svcList.filters}
                  onFilterChange={svcList.setFilter}
                  onReset={svcList.resetAll}
                  activeCount={svcList.activeFilterCount}
                  fields={[
                    {
                      key: 'status',
                      label: isAr ? 'الحالة' : 'Status',
                      options: [
                        { value: 'all', label: isAr ? 'الكل' : 'All' },
                        { value: 'active', label: isAr ? 'نشط' : 'Active' },
                        { value: 'inactive', label: isAr ? 'غير نشط' : 'Inactive' },
                      ],
                    },
                    {
                      key: 'category',
                      label: isAr ? 'التصنيف' : 'Category',
                      options: [
                        { value: 'all', label: isAr ? 'الكل' : 'All' },
                        ...categoryOptions.map((c) => ({ value: c, label: c })),
                      ],
                    },
                  ]}
                />
              }
            />
          </div>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4 min-w-0">
          <MasterLuxePanel className="space-y-3 lg:col-span-1 min-w-0" padding="lg">
            <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
              {isAr ? 'تعديل نقاط (سبب مطلوب)' : 'Point adjustment (reason required)'}
            </p>
            <MasterStoreScopeFilter
              value={adjStore || 'all'}
              onChange={(id) => setAdjStore(id === 'all' ? '' : id)}
              statusFilter={ledgerStoreStatus}
              onStatusFilterChange={setLedgerStoreStatus}
              showStatusChips
              className="w-full"
            />
            <select
              value={adjType}
              onChange={(e) => setAdjType(e.target.value as 'grant' | 'deduction')}
              className="w-full rounded-xl border text-sm px-3 py-2"
              style={fieldStyle}
            >
              <option value="grant">{isAr ? 'منح' : 'Grant'}</option>
              <option value="deduction">{isAr ? 'خصم' : 'Deduction'}</option>
            </select>
            <input
              type="number"
              value={adjPoints}
              onChange={(e) => setAdjPoints(Number(e.target.value) || 0)}
              className="w-full rounded-xl border text-sm px-3 py-2"
              style={fieldStyle}
            />
            <textarea
              value={adjReason}
              onChange={(e) => setAdjReason(e.target.value)}
              rows={2}
              placeholder={isAr ? 'السبب' : 'Reason'}
              className="w-full rounded-xl border text-sm px-3 py-2"
              style={fieldStyle}
            />
            <button type="button" className="unity-btn-primary text-sm" onClick={() => void adjust()}>
              {isAr ? 'تسجيل' : 'Record'}
            </button>
          </MasterLuxePanel>
          <div className="lg:col-span-2 min-w-0 space-y-3">
            <MasterStoreScopeFilter
              value={ledgerStore}
              onChange={setLedgerStore}
              statusFilter={ledgerStoreStatus}
              onStatusFilterChange={setLedgerStoreStatus}
              showStatusChips
            />
            <AdvancedDataTable
              rows={txPipe.pageRows}
              columns={txColumns}
              rowKey={(row) => String(row.id)}
              search={txList.search}
              onSearchChange={txList.setSearch}
              searchPlaceholder={isAr ? 'بحث في السجل…' : 'Search ledger…'}
              sortKey={txList.sortKey}
              sortDir={txList.sortDir}
              onSort={txList.onSort}
              page={txPipe.safePage}
              pageSize={txList.pageSize}
              onPageChange={txList.setPage}
              onPageSizeChange={txList.setPageSize}
              total={txPipe.total}
              loading={busy && tx.length === 0}
              emptyMessage={isAr ? 'لا توجد سجلات' : 'No records found'}
              filters={
                <AdvancedFilterBar
                  filterValues={txList.filters}
                  onFilterChange={txList.setFilter}
                  dateFrom={txList.dateFrom}
                  dateTo={txList.dateTo}
                  onDateFromChange={txList.setDateFrom}
                  onDateToChange={txList.setDateTo}
                  onReset={txList.resetAll}
                  activeCount={txList.activeFilterCount}
                  fields={[
                    {
                      key: 'type',
                      label: isAr ? 'النوع' : 'Type',
                      options: [
                        { value: 'all', label: isAr ? 'الكل' : 'All' },
                        { value: 'grant', label: isAr ? 'منح' : 'Grant' },
                        { value: 'deduction', label: isAr ? 'خصم' : 'Deduction' },
                      ],
                    },
                  ]}
                />
              }
            />
          </div>
        </div>
      )}

      <GlobalModal
        isOpen={!!editRow}
        onClose={() => setEditRow(null)}
        aria-label={isAr ? 'تعديل الخدمة' : 'Edit service'}
      >
        <div
          className="rounded-2xl border max-w-md w-full p-5 space-y-3 shadow-xl"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>
            {isAr ? 'تعديل الخدمة' : 'Edit service'}
          </h2>
          <input
            value={String(editRow?.name || '')}
            onChange={(e) => setEditRow((r) => (r ? { ...r, name: e.target.value } : r))}
            className="w-full rounded-xl border text-sm px-3 py-2"
            style={fieldStyle}
            placeholder={isAr ? 'الاسم' : 'Name'}
          />
          <input
            value={String(editRow?.name_ar || '')}
            onChange={(e) => setEditRow((r) => (r ? { ...r, name_ar: e.target.value } : r))}
            className="w-full rounded-xl border text-sm px-3 py-2"
            style={fieldStyle}
            placeholder={isAr ? 'الاسم العربي' : 'Arabic name'}
          />
          <input
            type="number"
            min={0}
            value={Number(editRow?.point_cost) || 0}
            onChange={(e) =>
              setEditRow((r) => (r ? { ...r, point_cost: Number(e.target.value) || 0 } : r))
            }
            className="w-full rounded-xl border text-sm px-3 py-2"
            style={fieldStyle}
          />
          <select
            value={String(editRow?.status || 'active')}
            onChange={(e) => setEditRow((r) => (r ? { ...r, status: e.target.value } : r))}
            className="w-full rounded-xl border text-sm px-3 py-2"
            style={fieldStyle}
          >
            <option value="active">{isAr ? 'نشط' : 'Active'}</option>
            <option value="inactive">{isAr ? 'غير نشط' : 'Inactive'}</option>
          </select>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="px-3 py-2 rounded-xl border text-sm"
              style={{ borderColor: 'var(--border)' }}
              onClick={() => setEditRow(null)}
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="button"
              className="unity-btn-primary text-sm"
              onClick={() => void saveEdit()}
              disabled={editSaving}
              aria-busy={editSaving}
            >
              {isAr ? 'حفظ' : 'Save'}
            </button>
          </div>
        </div>
      </GlobalModal>
    </AdminPageShell>
  );
};
