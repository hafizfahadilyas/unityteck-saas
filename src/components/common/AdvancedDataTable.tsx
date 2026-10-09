import React from 'react';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { usePrefs } from '../../i18n/PrefsContext';

export type AdvancedTableColumn<T> = {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  align?: 'left' | 'right' | 'center';
  render: (row: T) => React.ReactNode;
};

export type AdvancedDataTableProps<T> = {
  rows: T[];
  columns: AdvancedTableColumn<T>[];
  rowKey: (row: T) => string;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  sortKey: string | null;
  sortDir: 'asc' | 'desc';
  onSort: (key: string) => void;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  total: number;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  toolbarRight?: React.ReactNode;
  pageSizeOptions?: number[];
};

// Logical alignment so columns mirror correctly in RTL (Arabic).
const alignClass = {
  left: 'text-start',
  right: 'text-end',
  center: 'text-center',
} as const;

export function AdvancedDataTable<T>({
  rows,
  columns,
  rowKey,
  search,
  onSearchChange,
  searchPlaceholder,
  filters,
  sortKey,
  sortDir,
  onSort,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  total,
  loading = false,
  error = null,
  emptyMessage,
  toolbarRight,
  pageSizeOptions = [10, 25, 50, 100],
}: AdvancedDataTableProps<T>) {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const placeholder = searchPlaceholder ?? (isAr ? 'بحث…' : 'Search…');
  const emptyText = emptyMessage ?? (isAr ? 'لا توجد سجلات.' : 'No rows found.');

  const lastPage = Math.max(1, Math.ceil(total / pageSize) || 1);
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sortKey !== colKey) {
      return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    }
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-blue-600 dark:text-blue-400" />
    ) : (
      <ArrowDown className="w-3 h-3 text-blue-600 dark:text-blue-400" />
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={placeholder}
              aria-label={placeholder}
              className="w-full ps-8 pe-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          {filters}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {toolbarRight}
          <label className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <span>{isAr ? 'الصفوف' : 'Rows'}</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              aria-label={isAr ? 'عدد الصفوف في الصفحة' : 'Rows per page'}
              className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-start text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[11px] bg-slate-50/50">
              {columns.map((col) => {
                const align = alignClass[col.align ?? 'left'];
                if (!col.sortable) {
                  return (
                    <th key={col.key} className={`py-3 px-3 ${align} ${col.className ?? ''}`}>
                      {col.header}
                    </th>
                  );
                }
                return (
                  <th key={col.key} className={`py-3 px-3 ${align} ${col.className ?? ''}`}>
                    <button
                      type="button"
                      onClick={() => onSort(col.key)}
                      title={isAr ? `ترتيب حسب ${col.header}` : `Sort by ${col.header}`}
                      className={`inline-flex items-center gap-1 hover:text-slate-700 transition-colors ${
                        col.align === 'right' ? 'ms-auto' : col.align === 'center' ? 'mx-auto' : ''
                      }`}
                    >
                      <span>{col.header}</span>
                      <SortIcon colKey={col.key} />
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-slate-400">
                  {isAr ? 'جارٍ التحميل…' : 'Loading…'}
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-rose-600 dark:text-rose-400">
                  {error}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-slate-400">
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={rowKey(row)} className="hover:bg-slate-50 transition-colors">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`py-3 px-3 ${alignClass[col.align ?? 'left']} ${col.className ?? ''}`}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
        <span>
          {total === 0
            ? isAr
              ? '0 نتيجة'
              : '0 results'
            : isAr
              ? `عرض ${from}–${to} من ${total}`
              : `Showing ${from}–${to} of ${total}`}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label={isAr ? 'الصفحة السابقة' : 'Previous page'}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
            {isAr ? 'السابق' : 'Prev'}
          </button>
          <span className="px-2 tabular-nums">
            {page} / {lastPage}
          </span>
          <button
            type="button"
            disabled={page >= lastPage}
            onClick={() => onPageChange(page + 1)}
            aria-label={isAr ? 'الصفحة التالية' : 'Next page'}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isAr ? 'التالي' : 'Next'}
            <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
}
