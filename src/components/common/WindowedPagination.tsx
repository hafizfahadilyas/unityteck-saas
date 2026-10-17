import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface WindowedPaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  isAr?: boolean;
  itemLabel?: string;
  pageSizeOptions?: number[];
}

export function getPaginationWindow(currentPage: number, totalPages: number): (number | '...')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, '...', totalPages];
  }
  if (currentPage >= totalPages - 3) {
    return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
}

export const WindowedPagination: React.FC<WindowedPaginationProps> = ({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
  isAr = false,
  itemLabel,
  pageSizeOptions = [10, 25, 50, 100],
}) => {
  const safePage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));
  const pages = getPaginationWindow(safePage, Math.max(1, totalPages));
  const fromRecord = totalCount > 0 ? (safePage - 1) * pageSize + 1 : 0;
  const toRecord = Math.min(safePage * pageSize, totalCount);

  const defaultItemLabel = isAr ? 'عنصر' : 'items';
  const label = itemLabel || defaultItemLabel;

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-t select-none"
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--muted)' }}>
        <div className="flex items-center gap-1.5">
          <span>{isAr ? 'عرض' : 'Show'}</span>
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="px-2 py-1 rounded-lg border text-xs font-semibold cursor-pointer"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <span>
          {isAr
            ? `عرض ${fromRecord}–${toRecord} من أصل ${totalCount.toLocaleString()} ${label}`
            : `Showing ${fromRecord}–${toRecord} of ${totalCount.toLocaleString()} ${label}`}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
          className="p-1.5 rounded-lg border cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
          style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--surface)' }}
          aria-label={isAr ? 'الصفحة السابقة' : 'Previous page'}
        >
          <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
        </button>

        {pages.map((p, idx) => {
          if (p === '...') {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="w-7 h-7 flex items-center justify-center text-xs font-bold"
                style={{ color: 'var(--muted)' }}
              >
                …
              </span>
            );
          }

          const pageNum = Number(p);
          const isActive = safePage === pageNum;

          return (
            <button
              key={`page-${pageNum}`}
              type="button"
              onClick={() => onPageChange(pageNum)}
              className="w-7 h-7 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-xs"
              style={
                isActive
                  ? { background: 'var(--portal-cta)', color: '#ffffff' }
                  : { background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border)' }
              }
            >
              {pageNum}
            </button>
          );
        })}

        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
          className="p-1.5 rounded-lg border cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
          style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--surface)' }}
          aria-label={isAr ? 'الصفحة التالية' : 'Next page'}
        >
          <ChevronRight className="w-4 h-4 rtl:rotate-180" />
        </button>
      </div>
    </div>
  );
};
