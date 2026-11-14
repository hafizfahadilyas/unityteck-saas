import React, { useMemo, useState } from 'react';
import { AdminPageShell, AdminPageHeader } from '../common/AdminPageHeader';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import { getStoreDisplayName } from '../../utils/storeLocalization';
import { Download, FileText } from 'lucide-react';
import { MasterLuxePanel, MasterMetaLine, masterGhostBtnClass } from './MasterUiKit';
import { MasterStoreScopeFilter } from './MasterStoreScopeFilter';
import { AdvancedFilterBar } from '../common/AdvancedFilterBar';
import { AdvancedDataTable, type AdvancedTableColumn } from '../common/AdvancedDataTable';
import { pipelineAdvancedList, useAdvancedListState } from '../../hooks/useAdvancedListState';

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

/** SOUQ PLUS Phase 1 §4.8 — operational counts from real orders; no fake compliance claims. */
type StoreRow = { storeId: string; storeName: string; orders: number; gmv: number };

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
  const list = useAdvancedListState({
    initialPageSize: 10,
    initialSortKey: 'gmv',
    initialSortDir: 'desc',
    initialFilters: {},
  });

  const globalOrders = useMemo(
    () =>
      Object.entries(allOrders || {}).flatMap(([storeId, orderList]) => {
        const store = stores.find((s) => s.id === storeId);
        const storeName = store ? getStoreDisplayName(store, locale) : storeId;
        return (orderList || []).map((o) => ({
          ...o,
          storeId,
          storeName,
          orderNumber: String((o as { orderNumber?: string }).orderNumber || o.id || ''),
          date: String(
            (o as { date?: string; createdAt?: string }).date ||
              (o as { createdAt?: string }).createdAt ||
              '',
          ),
          total: Number((o as { total?: number }).total) || 0,
        }));
      }),
    [allOrders, stores, locale],
  );

  const scopedOrders = useMemo(() => {
    const fromTs = dateFrom ? Date.parse(`${dateFrom}T00:00:00`) : NaN;
    const toTs = dateTo ? Date.parse(`${dateTo}T23:59:59`) : NaN;
    return globalOrders.filter((o) => {
      if (storeScope !== 'all' && o.storeId !== storeScope) return false;
      if (storeScope === 'all' && storeStatus !== 'all') {
        const st = stores.find((s) => s.id === o.storeId);
        if (!st || st.status !== storeStatus) return false;
      }
      if (dateFrom || dateTo) {
        const created = o.date ? Date.parse(String(o.date)) : NaN;
        if (!Number.isNaN(fromTs) && !Number.isNaN(created) && created < fromTs) return false;
        if (!Number.isNaN(toTs) && !Number.isNaN(created) && created > toTs) return false;
      }
      return true;
    });
  }, [globalOrders, storeScope, storeStatus, stores, dateFrom, dateTo]);

  const orderCount = scopedOrders.length;
  const gmv = scopedOrders.reduce((s, o) => s + o.total, 0);
  const vatEstimate = (gmv * 15) / 115;

  const perStore = useMemo(() => {
    const map = new Map<string, StoreRow>();
    for (const o of scopedOrders) {
      const cur = map.get(o.storeId) || {
        storeId: o.storeId,
        storeName: o.storeName,
        orders: 0,
        gmv: 0,
      };
      cur.orders += 1;
      cur.gmv += o.total;
      map.set(o.storeId, cur);
    }
    return Array.from(map.values());
  }, [scopedOrders]);

  const storePipe = useMemo(
    () =>
      pipelineAdvancedList({
        rows: perStore,
        search: list.search,
        getSearchBlob: (row) => `${row.storeName} ${row.storeId}`,
        filters: list.filters,
        sortKey: list.sortKey,
        sortDir: list.sortDir,
        getSortValue: (row, key) => {
          if (key === 'store') return row.storeName;
          if (key === 'orders') return row.orders;
          if (key === 'gmv') return row.gmv;
          if (key === 'vat') return (row.gmv * 15) / 115;
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

  const scopeFilterCount =
    (storeScope !== 'all' ? 1 : 0) +
    (storeStatus !== 'all' ? 1 : 0) +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0);

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
          <button
            type="button"
            className="unity-btn-primary text-sm"
            onClick={generateZatcaXml}
            disabled={orderCount === 0}
          >
            <Download className="w-3.5 h-3.5" aria-hidden />
            {isAr ? 'تصدير ملف ضريبة القيمة المضافة' : 'Export VAT XML'}
          </button>
        }
      />

      {exportedAt ? (
        <MasterMetaLine className="mt-2">
          {isAr ? `آخر تصدير: ${exportedAt.slice(0, 19)}` : `Last export: ${exportedAt.slice(0, 19)}`}
        </MasterMetaLine>
      ) : null}

      <div className="mt-4 flex flex-col gap-3">
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
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          showDates
          activeCount={scopeFilterCount}
          onReset={() => {
            setStoreScope('all');
            setStoreStatus('all');
            setDateFrom('');
            setDateTo('');
          }}
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
          emptyMessage={isAr ? 'لا توجد سجلات' : 'No records found'}
          filters={
            <AdvancedFilterBar
              showDates={false}
              filterValues={list.filters}
              onFilterChange={list.setFilter}
              onReset={list.resetAll}
              activeCount={list.activeFilterCount}
            />
          }
        />
      </div>
    </AdminPageShell>
  );
};
