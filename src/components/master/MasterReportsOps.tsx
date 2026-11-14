import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminPageShell, AdminPageHeader } from '../common/AdminPageHeader';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import { getStoreDisplayName } from '../../utils/storeLocalization';
import { Download, FileText, RefreshCw } from 'lucide-react';
import { MasterLuxePanel, MasterMetaLine, masterGhostBtnClass } from './MasterUiKit';
import { MasterStoreScopeFilter } from './MasterStoreScopeFilter';
import { AdvancedFilterBar } from '../common/AdvancedFilterBar';
import { AdvancedDataTable, type AdvancedTableColumn } from '../common/AdvancedDataTable';
import { pipelineAdvancedList, useAdvancedListState } from '../../hooks/useAdvancedListState';
import { fetchOrders } from '../../api/tenantApi';
import type { Order, Store } from '../../types';

/** Trigger a browser download for in-memory content (CSV / XML). */
const downloadFile = (filename: string, content: string, mime: string) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const normPay = (v: unknown) => String(v || '').trim().toLowerCase();

type LeanOrder = {
  id: string;
  storeId: string;
  storeName: string;
  orderNumber: string;
  date: string;
  total: number;
  status: string;
  paymentStatus: string;
};

/** SOUQ PLUS Phase 1 §4.8 — operational counts from real orders; no fake compliance claims. */
type StoreRow = {
  storeId: string;
  storeName: string;
  status: Store['status'] | string;
  plan: string;
  orders: number;
  gmv: number;
};

export const MasterReportsOps: React.FC = () => {
  const { stores, allOrders } = useTenant();
  const { locale, money } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();
  const [exportedAt, setExportedAt] = useState<string | null>(null);
  const [storeScope, setStoreScope] = useState<string>('all');
  const [storeStatus, setStoreStatus] = useState<'all' | 'active' | 'pending' | 'suspended'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [orderStatus, setOrderStatus] = useState('all');
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [busy, setBusy] = useState(false);
  const [liveByStore, setLiveByStore] = useState<Record<string, LeanOrder[]>>({});
  const [loadMeta, setLoadMeta] = useState<{ stores: number; orders: number; at?: string }>({
    stores: 0,
    orders: 0,
  });

  const list = useAdvancedListState({
    initialPageSize: 10,
    initialSortKey: 'gmv',
    initialSortDir: 'desc',
    initialFilters: { plan: 'all', status: 'all', gmv: 'all', activity: 'all' },
  });

  const loadAllStoreOrders = useCallback(async () => {
    if (!stores.length) {
      setLiveByStore({});
      setLoadMeta({ stores: 0, orders: 0 });
      return;
    }
    setBusy(true);
    try {
      const settled = await Promise.all(
        stores.map(async (store) => {
          const storeName = getStoreDisplayName(store, locale);
          try {
            const rows = await fetchOrders(store.id, { all: true, lean: true });
            const lean: LeanOrder[] = (Array.isArray(rows) ? rows : []).map((o: Order) => ({
              id: String(o.id || ''),
              storeId: store.id,
              storeName,
              orderNumber: String(o.orderNumber || o.id || ''),
              date: String(o.date || o.createdAt || ''),
              total: Number(o.total) || 0,
              status: String(o.status || ''),
              paymentStatus: normPay(o.paymentStatus),
            }));
            return { storeId: store.id, lean, ok: true as const };
          } catch {
            // Fallback: whatever TenantContext already holds for this store_id
            const cached = (allOrders?.[store.id] || []) as Order[];
            const lean: LeanOrder[] = cached.map((o) => ({
              id: String(o.id || ''),
              storeId: store.id,
              storeName,
              orderNumber: String(o.orderNumber || o.id || ''),
              date: String(o.date || o.createdAt || ''),
              total: Number(o.total) || 0,
              status: String(o.status || ''),
              paymentStatus: normPay(o.paymentStatus),
            }));
            return { storeId: store.id, lean, ok: false as const };
          }
        }),
      );
      const next: Record<string, LeanOrder[]> = {};
      let orderTotal = 0;
      for (const row of settled) {
        next[row.storeId] = row.lean;
        orderTotal += row.lean.length;
      }
      setLiveByStore(next);
      setLoadMeta({
        stores: stores.length,
        orders: orderTotal,
        at: new Date().toISOString(),
      });
    } catch {
      toast(isAr ? 'تعذر تحميل الطلبات' : 'Failed to load orders', 'error');
    } finally {
      setBusy(false);
    }
  }, [stores, locale, allOrders, isAr, toast]);

  useEffect(() => {
    void loadAllStoreOrders();
    // Re-fetch when store list changes (new tenant / soft refresh)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stores.map((s) => s.id).join('|')]);

  const globalOrders = useMemo(
    () => Object.values(liveByStore).flat(),
    [liveByStore],
  );

  const statusOptions = useMemo(() => {
    const set = new Set<string>();
    for (const o of globalOrders) {
      if (o.status) set.add(o.status);
    }
    return Array.from(set).sort();
  }, [globalOrders]);

  const paymentOptions = useMemo(() => {
    const set = new Set<string>();
    for (const o of globalOrders) {
      if (o.paymentStatus) set.add(o.paymentStatus);
    }
    return Array.from(set).sort();
  }, [globalOrders]);

  const planOptions = useMemo(() => {
    const set = new Set<string>();
    for (const s of stores) {
      const p = String(s.plan || '').trim();
      if (p) set.add(p);
    }
    return Array.from(set).sort();
  }, [stores]);

  const scopedOrders = useMemo(() => {
    const fromTs = dateFrom ? Date.parse(`${dateFrom}T00:00:00`) : NaN;
    const toTs = dateTo ? Date.parse(`${dateTo}T23:59:59`) : NaN;
    return globalOrders.filter((o) => {
      if (storeScope !== 'all' && o.storeId !== storeScope) return false;
      if (storeScope === 'all' && storeStatus !== 'all') {
        const st = stores.find((s) => s.id === o.storeId);
        if (!st || st.status !== storeStatus) return false;
      }
      if (orderStatus !== 'all' && o.status !== orderStatus) return false;
      if (paymentStatus !== 'all' && o.paymentStatus !== paymentStatus) return false;
      if (dateFrom || dateTo) {
        const created = o.date ? Date.parse(String(o.date)) : NaN;
        if (!Number.isNaN(fromTs) && !Number.isNaN(created) && created < fromTs) return false;
        if (!Number.isNaN(toTs) && !Number.isNaN(created) && created > toTs) return false;
      }
      return true;
    });
  }, [globalOrders, storeScope, storeStatus, stores, dateFrom, dateTo, orderStatus, paymentStatus]);

  const orderCount = scopedOrders.length;
  const gmv = scopedOrders.reduce((s, o) => s + o.total, 0);
  const vatEstimate = (gmv * 15) / 115;

  const perStore = useMemo(() => {
    const map = new Map<string, StoreRow>();
    // Seed every in-scope store so empty tenants stay visible (0 / Waiting — never invent GMV)
    const seedStores = stores.filter((s) => {
      if (storeScope !== 'all' && s.id !== storeScope) return false;
      if (storeStatus !== 'all' && s.status !== storeStatus) return false;
      return true;
    });
    for (const s of seedStores) {
      map.set(s.id, {
        storeId: s.id,
        storeName: getStoreDisplayName(s, locale),
        status: s.status,
        plan: String(s.plan || ''),
        orders: 0,
        gmv: 0,
      });
    }
    for (const o of scopedOrders) {
      const store = stores.find((s) => s.id === o.storeId);
      const cur = map.get(o.storeId) || {
        storeId: o.storeId,
        storeName: o.storeName,
        status: store?.status || '',
        plan: String(store?.plan || ''),
        orders: 0,
        gmv: 0,
      };
      cur.orders += 1;
      cur.gmv += o.total;
      map.set(o.storeId, cur);
    }
    return Array.from(map.values());
  }, [scopedOrders, stores, storeScope, storeStatus, locale]);

  const storePipe = useMemo(
    () =>
      pipelineAdvancedList({
        rows: perStore,
        search: list.search,
        getSearchBlob: (row) => `${row.storeName} ${row.storeId} ${row.plan} ${row.status}`,
        filters: list.filters,
        matchFilter: (row, key, value) => {
          if (key === 'plan') return row.plan === value;
          if (key === 'status') return String(row.status) === value;
          if (key === 'activity') {
            if (value === 'with_orders') return row.orders > 0;
            if (value === 'empty') return row.orders === 0;
            return true;
          }
          if (key === 'gmv') {
            if (value === 'lt1k') return row.gmv < 1000;
            if (value === '1k_10k') return row.gmv >= 1000 && row.gmv < 10000;
            if (value === '10k_plus') return row.gmv >= 10000;
            return true;
          }
          return true;
        },
        sortKey: list.sortKey,
        sortDir: list.sortDir,
        getSortValue: (row, key) => {
          if (key === 'store') return row.storeName;
          if (key === 'orders') return row.orders;
          if (key === 'gmv') return row.gmv;
          if (key === 'vat') return (row.gmv * 15) / 115;
          if (key === 'plan') return row.plan;
          if (key === 'status') return String(row.status);
          return '';
        },
        page: list.page,
        pageSize: list.pageSize,
      }),
    [perStore, list],
  );

  const storeColumns = useMemo<AdvancedTableColumn<StoreRow>[]>(
    () => [
      {
        key: 'store',
        header: isAr ? 'المتجر' : 'Store',
        sortable: true,
        render: (row) => (
          <div className="min-w-0">
            <div className="font-semibold truncate max-w-[240px]">{row.storeName}</div>
            <div className="text-[10px] font-mono" style={{ color: 'var(--muted)' }}>
              {row.storeId}
            </div>
          </div>
        ),
      },
      {
        key: 'plan',
        header: isAr ? 'الباقة' : 'Plan',
        sortable: true,
        render: (row) => (
          <span className="text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>
            {row.plan || '—'}
          </span>
        ),
      },
      {
        key: 'status',
        header: isAr ? 'حالة المتجر' : 'Store status',
        sortable: true,
        render: (row) => (
          <span className="text-xs font-semibold capitalize" style={{ color: 'var(--text)' }}>
            {row.status || '—'}
          </span>
        ),
      },
      {
        key: 'orders',
        header: isAr ? 'الطلبات' : 'Orders',
        sortable: true,
        render: (row) => (
          <span className="tabular-nums" dir="ltr">
            {row.orders}
          </span>
        ),
      },
      {
        key: 'gmv',
        header: isAr ? 'إجمالي المبيعات' : 'GMV',
        sortable: true,
        render: (row) => <span className="tabular-nums">{money(row.gmv)}</span>,
      },
      {
        key: 'vat',
        header: isAr ? 'ضريبة القيمة المضافة (١٥٪)' : 'VAT (15%)',
        sortable: true,
        render: (row) => (
          <span className="tabular-nums" style={{ color: 'var(--muted)' }}>
            {money((row.gmv * 15) / 115)}
          </span>
        ),
      },
    ],
    [isAr, money],
  );

  const generateZatcaXml = () => {
    if (orderCount === 0) {
      toast(isAr ? 'لا توجد طلبات للتصدير' : 'No orders to export', 'warning');
      return;
    }
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const invoices = scopedOrders
      .map((o) => {
        const vat = (o.total * 15) / 115;
        return `  <Invoice id="${esc(o.orderNumber)}" store="${esc(o.storeName)}" date="${esc(o.date)}">\n    <Total currency="SAR">${o.total.toFixed(2)}</Total>\n    <VAT rate="15">${vat.toFixed(2)}</VAT>\n  </Invoice>`;
      })
      .join('\n');
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<!-- Operational VAT export — generated ${new Date().toISOString()} -->\n<FatooraPackage invoices="${orderCount}">\n${invoices}\n</FatooraPackage>\n`;
    const stamp = new Date().toISOString().slice(0, 10);
    downloadFile(`zatca-export-${stamp}.xml`, xml, 'application/xml;charset=utf-8');
    setExportedAt(new Date().toISOString());
    toast(
      isAr ? 'تم تصدير ملف ضريبة القيمة المضافة من الطلبات الحقيقية' : 'VAT XML exported from real orders',
      'success',
    );
  };

  const exportBreakdownCsv = () => {
    const rows = storePipe.filtered;
    if (rows.length === 0) {
      toast(isAr ? 'لا توجد سجلات للتصدير' : 'No rows to export', 'warning');
      return;
    }
    const header = ['store_id', 'store_name', 'plan', 'status', 'orders', 'gmv_sar', 'vat_15_sar'];
    const lines = [
      header.join(','),
      ...rows.map((r) =>
        [
          r.storeId,
          `"${r.storeName.replace(/"/g, '""')}"`,
          r.plan,
          r.status,
          r.orders,
          r.gmv.toFixed(2),
          ((r.gmv * 15) / 115).toFixed(2),
        ].join(','),
      ),
    ];
    const stamp = new Date().toISOString().slice(0, 10);
    downloadFile(`store-breakdown-${stamp}.csv`, lines.join('\n'), 'text/csv;charset=utf-8');
    setExportedAt(new Date().toISOString());
    toast(isAr ? 'تم تصدير تفصيل المتاجر' : 'Store breakdown CSV exported', 'success');
  };

  const scopeFilterCount =
    (storeScope !== 'all' ? 1 : 0) +
    (storeStatus !== 'all' ? 1 : 0) +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0) +
    (orderStatus !== 'all' ? 1 : 0) +
    (paymentStatus !== 'all' ? 1 : 0);

  const resetScopeFilters = () => {
    setStoreScope('all');
    setStoreStatus('all');
    setDateFrom('');
    setDateTo('');
    setOrderStatus('all');
    setPaymentStatus('all');
  };

  return (
    <AdminPageShell>
      <AdminPageHeader
        title={isAr ? 'التقارير والامتثال' : 'Reports & Compliance'}
        subtitle={
          isAr
            ? 'أعداد تشغيلية من طلبات المتاجر الحقيقية — بدون ادعاءات وهمية'
            : 'Operational counts from real store orders — no decorative claims'
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={masterGhostBtnClass}
              onClick={() => void loadAllStoreOrders()}
              disabled={busy}
              aria-busy={busy}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} aria-hidden />
              {isAr ? 'تحديث' : 'Refresh'}
            </button>
            <button
              type="button"
              className={masterGhostBtnClass}
              onClick={exportBreakdownCsv}
              disabled={storePipe.total === 0}
            >
              <Download className="w-3.5 h-3.5" aria-hidden />
              {isAr ? 'تصدير CSV' : 'Export CSV'}
            </button>
            <button
              type="button"
              className="unity-btn-primary text-sm"
              onClick={generateZatcaXml}
              disabled={orderCount === 0}
            >
              <Download className="w-3.5 h-3.5" aria-hidden />
              {isAr ? 'تصدير ملف ضريبة القيمة المضافة' : 'Export VAT XML'}
            </button>
          </div>
        }
      />

      <MasterMetaLine className="mt-2">
        {isAr
          ? `المصدر: طلبات حية · ${loadMeta.orders} طلب من ${loadMeta.stores} متجر`
          : `Source: live orders · ${loadMeta.orders} orders across ${loadMeta.stores} stores`}
        {loadMeta.at ? ` · ${loadMeta.at.slice(0, 19)}` : ''}
        {exportedAt
          ? isAr
            ? ` · آخر تصدير: ${exportedAt.slice(0, 19)}`
            : ` · Last export: ${exportedAt.slice(0, 19)}`
          : ''}
      </MasterMetaLine>

      <div className="mt-4 flex flex-col gap-3">
        <MasterStoreScopeFilter
          value={storeScope}
          onChange={setStoreScope}
          statusFilter={storeStatus}
          onStatusFilterChange={setStoreStatus}
          showStatusChips
        />
        <AdvancedFilterBar
          fields={[
            {
              key: 'order_status',
              label: isAr ? 'حالة الطلب' : 'Order status',
              options: [
                { value: 'all', label: isAr ? 'كل الحالات' : 'All statuses' },
                ...statusOptions.map((s) => ({ value: s, label: s })),
              ],
            },
            {
              key: 'payment_status',
              label: isAr ? 'حالة الدفع' : 'Payment status',
              options: [
                { value: 'all', label: isAr ? 'كل المدفوعات' : 'All payments' },
                ...paymentOptions.map((s) => ({ value: s, label: s })),
              ],
            },
          ]}
          filterValues={{ order_status: orderStatus, payment_status: paymentStatus }}
          onFilterChange={(key, value) => {
            if (key === 'order_status') setOrderStatus(value);
            if (key === 'payment_status') setPaymentStatus(value);
          }}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          showDates
          activeCount={scopeFilterCount}
          onReset={resetScopeFilters}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MasterLuxePanel className="space-y-1" padding="lg">
          <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
            {isAr ? 'ضريبة القيمة المضافة المقدّرة (١٥٪)' : 'Estimated VAT (15%)'}
          </span>
          <div className="text-2xl font-black" style={{ color: 'var(--text)' }}>
            {money(vatEstimate)}
          </div>
          <span className="text-[10px]" style={{ color: 'var(--muted)' }}>
            {isAr ? 'محسوبة من إجمالي الطلبات المسجّلة' : 'Calculated from recorded order totals'}
          </span>
        </MasterLuxePanel>

        <MasterLuxePanel className="space-y-1" padding="lg">
          <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
            {isAr ? 'فواتير الطلبات المسجّلة' : 'Recorded order invoices'}
          </span>
          <div className="text-2xl font-black" style={{ color: 'var(--text)' }} dir="ltr">
            {orderCount}
          </div>
          <span className="text-[10px]" style={{ color: 'var(--muted)' }}>
            {isAr ? 'من قاعدة بيانات المتاجر فقط' : 'From store order data only'}
          </span>
        </MasterLuxePanel>

        <MasterLuxePanel className="space-y-1" padding="lg">
          <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
            {isAr ? 'إجمالي المبيعات المسجّلة' : 'Recorded GMV'}
          </span>
          <div className="text-2xl font-black" style={{ color: 'var(--text)' }}>
            {money(gmv)}
          </div>
          <span className="text-[10px]" style={{ color: 'var(--muted)' }}>
            {isAr
              ? 'مطابقة المدفوعات مؤجلة حتى ربط بوابة موثوقة'
              : 'Payment reconciliation deferred until a trusted gateway is connected'}
          </span>
        </MasterLuxePanel>
      </div>

      <MasterLuxePanel className="mt-4 flex flex-col sm:flex-row gap-3 items-start" padding="lg">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
            color: 'var(--accent)',
          }}
        >
          <FileText className="w-5 h-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
            {isAr ? 'تصدير تشغيلي' : 'Operational export'}
          </p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
            {isAr
              ? 'ملف التصدير مبني على الطلبات الحقيقية فقط. لا يُعرض ختم تشفيري أو تسوية يومية آلية بدون دفتر مدفوعات موثوق.'
              : 'Export is built from real orders only. No cryptographic stamp or daily automated payout claim without a trusted payment ledger.'}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={masterGhostBtnClass}
              onClick={generateZatcaXml}
              disabled={orderCount === 0}
            >
              <Download className="w-3.5 h-3.5" aria-hidden />
              {orderCount === 0
                ? isAr
                  ? 'لا توجد طلبات'
                  : 'No orders'
                : isAr
                  ? 'تصدير الآن'
                  : 'Export now'}
            </button>
            <button
              type="button"
              className={masterGhostBtnClass}
              onClick={exportBreakdownCsv}
              disabled={storePipe.total === 0}
            >
              <Download className="w-3.5 h-3.5" aria-hidden />
              {isAr ? 'تصدير تفصيل المتاجر' : 'Export store breakdown'}
            </button>
          </div>
        </div>
      </MasterLuxePanel>

      <div className="mt-4 space-y-2">
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
            {isAr ? 'تفصيل حسب المتجر' : 'Per-store breakdown'}
          </p>
          <MasterMetaLine>
            {isAr
              ? 'أرقام حقيقية من طلبات كل متجر فقط'
              : 'Live order totals per store — no invented rows'}
          </MasterMetaLine>
        </div>
        <AdvancedDataTable
          rows={storePipe.pageRows}
          columns={storeColumns}
          rowKey={(row) => row.storeId}
          search={list.search}
          onSearchChange={list.setSearch}
          searchPlaceholder={isAr ? 'بحث باسم المتجر…' : 'Search store…'}
          sortKey={list.sortKey}
          sortDir={list.sortDir}
          onSort={list.onSort}
          page={storePipe.safePage}
          pageSize={list.pageSize}
          onPageChange={list.setPage}
          onPageSizeChange={list.setPageSize}
          total={storePipe.total}
          loading={busy && storePipe.total === 0}
          emptyMessage={isAr ? 'لا توجد سجلات' : 'No records found'}
          filters={
            <AdvancedFilterBar
              showDates={false}
              filterValues={list.filters}
              onFilterChange={list.setFilter}
              onReset={list.resetAll}
              activeCount={list.activeFilterCount}
              fields={[
                {
                  key: 'plan',
                  label: isAr ? 'الباقة' : 'Plan',
                  options: [
                    { value: 'all', label: isAr ? 'كل الباقات' : 'All plans' },
                    ...planOptions.map((p) => ({ value: p, label: p })),
                  ],
                },
                {
                  key: 'status',
                  label: isAr ? 'حالة المتجر' : 'Store status',
                  options: [
                    { value: 'all', label: isAr ? 'الكل' : 'All' },
                    { value: 'active', label: isAr ? 'نشط' : 'Active' },
                    { value: 'pending', label: isAr ? 'قيد الانتظار' : 'Pending' },
                    { value: 'suspended', label: isAr ? 'موقوف' : 'Suspended' },
                  ],
                },
                {
                  key: 'activity',
                  label: isAr ? 'النشاط' : 'Activity',
                  options: [
                    { value: 'all', label: isAr ? 'الكل' : 'All' },
                    { value: 'with_orders', label: isAr ? 'لديه طلبات' : 'With orders' },
                    { value: 'empty', label: isAr ? 'بدون طلبات' : 'No orders' },
                  ],
                },
                {
                  key: 'gmv',
                  label: isAr ? 'نطاق المبيعات' : 'GMV range',
                  options: [
                    { value: 'all', label: isAr ? 'كل المبيعات' : 'All GMV' },
                    { value: 'lt1k', label: isAr ? 'أقل من ١٬٠٠٠' : '< 1,000' },
                    { value: '1k_10k', label: '1,000 – 9,999' },
                    { value: '10k_plus', label: isAr ? '١٠٬٠٠٠+' : '10,000+' },
                  ],
                },
              ]}
            />
          }
        />
      </div>
    </AdminPageShell>
  );
};
