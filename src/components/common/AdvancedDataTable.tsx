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
  dense?: boolean;
};

const alignClass = {
  left: 'text-start',
  right: 'text-end',
  center: 'text-center',
} as const;

/** Shared advanced data table — Holst global color + font tokens. */
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
  dense = false,
}: AdvancedDataTableProps<T>) {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const placeholder = searchPlaceholder ?? (isAr ? 'بحث…' : 'Search…');
  const emptyText = emptyMessage ?? (isAr ? 'لا توجد سجلات.' : 'No records found.');

  const lastPage = Math.max(1, Math.ceil(total / pageSize) || 1);
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sortKey !== colKey) {
      return <ArrowUpDown className="w-3 h-3 opacity-40" style={{ color: 'var(--muted)' }} />;
    }
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3 h-3" style={{ color: 'var(--accent)' }} />
    ) : (
      <ArrowDown className="w-3 h-3" style={{ color: 'var(--accent)' }} />
    );
  };

  const shellStyle: React.CSSProperties = {
    background: 'var(--surface)',
    borderColor: 'var(--border)',
    color: 'var(--text)',
    fontFamily: 'var(--font-ui)',
    borderRadius: 'var(--radius-ctrl, 1rem)',
  };

  const inputStyle: React.CSSProperties = {
    background: 'var(--bg)',
    borderColor: 'var(--border)',
    color: 'var(--text)',
    fontFamily: 'var(--font-ui)',
    borderRadius: 'var(--radius-ctrl, 0.75rem)',
  };

  return (
    <div className="border shadow-2xs overflow-hidden" style={shellStyle}>
      <div
        className={`border-b flex flex-col gap-3 ${dense ? 'p-3' : 'p-4'}`}
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[180px] max-w-md">
            <Search
              className="w-3.5 h-3.5 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--muted)' }}
              aria-hidden
            />
            <input
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={placeholder}
              aria-label={placeholder}
              className="w-full ps-8 pe-3 py-2 text-xs border focus:outline-none"
              style={inputStyle}
            />
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {toolbarRight}
            <label
              className="flex items-center gap-1.5 text-[11px] font-semibold"
              style={{ color: 'var(--muted)' }}
            >
              <span>{isAr ? 'الصفوف' : 'Rows'}</span>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                aria-label={isAr ? 'عدد الصفوف في الصفحة' : 'Rows per page'}
                className="px-2 py-1.5 text-xs border focus:outline-none"
                style={inputStyle}
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
        {filters ? <div className="min-w-0 overflow-x-auto">{filters}</div> : null}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-start text-xs" style={{ fontFamily: 'var(--font-ui)' }}>
          <thead>
            <tr
              className="border-b font-semibold text-[11px]"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--muted)',
                background: 'color-mix(in srgb, var(--bg) 70%, var(--surface))',
              }}
            >
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
                      className={`inline-flex items-center gap-1 transition-colors ${
                        col.align === 'right' ? 'ms-auto' : col.align === 'center' ? 'mx-auto' : ''
                      }`}
                      style={{ color: 'inherit' }}
                    >
                      <span>{col.header}</span>
                      <SortIcon colKey={col.key} />
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-12 text-center"
                  style={{ color: 'var(--muted)' }}
                >
                  {isAr ? 'جارٍ التحميل…' : 'Loading…'}
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-12 text-center font-semibold"
                  style={{ color: 'var(--tone-danger, #e11d48)' }}
                >
                  {error}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-12 text-center"
                  style={{ color: 'var(--muted)' }}
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  className="transition-colors"
                  style={{ borderTop: '1px solid var(--border)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      'color-mix(in srgb, var(--accent) 6%, var(--surface))';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`py-3 px-3 ${alignClass[col.align ?? 'left']} ${col.className ?? ''}`}
                      style={{ color: 'var(--text)' }}
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

      <div
        className="px-4 py-3 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]"
        style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
      >
        <span className="tabular-nums">
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
            className="inline-flex items-center gap-1 px-2.5 py-1 border disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            style={inputStyle}
          >
            <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
            {isAr ? 'السابق' : 'Prev'}
          </button>
          <span className="px-2 tabular-nums font-bold" style={{ color: 'var(--text)' }}>
            {page} / {lastPage}
          </span>
          <button
            type="button"
            disabled={page >= lastPage}
            onClick={() => onPageChange(page + 1)}
            aria-label={isAr ? 'الصفحة التالية' : 'Next page'}
            className="inline-flex items-center gap-1 px-2.5 py-1 border disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            style={inputStyle}
          >
            {isAr ? 'التالي' : 'Next'}
            <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
}
