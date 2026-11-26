import React from 'react';
import type { SkeletonTableProps } from './types';
import { Skeleton } from './Skeleton';
import { SkeletonTableRow } from './SkeletonTableRow';

export const SkeletonTable: React.FC<SkeletonTableProps> = ({
  columns = 5,
  rows = 6,
  columnWidths,
  hasHeader = true,
  hasPagination = true,
  hasToolbar = true,
  dense = false,
  className = '',
  style,
  animation,
  speed,
}) => {
  return (
    <div
      className={`souq-skeleton-card w-full overflow-hidden flex flex-col ${className}`}
      style={style}
      aria-busy="true"
      role="status"
      aria-label="Loading table data…"
    >
      {/* Toolbar placeholder */}
      {hasToolbar && (
        <div className="p-3 sm:p-4 border-b border-[var(--border,#e2e8f0)] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <Skeleton variant="rounded" height="38px" width="100%" className="rounded-xl" animation={animation} speed={speed} />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton variant="rounded" height="36px" width="80px" className="rounded-xl" animation={animation} speed={speed} />
            <Skeleton variant="rounded" height="36px" width="100px" className="rounded-xl" animation={animation} speed={speed} />
          </div>
        </div>
      )}

      {/* Table container */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-start text-xs">
          {hasHeader && (
            <thead>
              <tr className="border-b border-[var(--border,#e2e8f0)] bg-[color-mix(in_srgb,var(--bg,#f8fafc)_70%,var(--surface,#ffffff))]">
                {Array.from({ length: columns }).map((_, i) => (
                  <th key={i} className="py-3 px-3 text-start">
                    <Skeleton
                      variant="rounded"
                      height="12px"
                      width={i === 0 ? '45%' : i === columns - 1 ? '35%' : '55%'}
                      className="rounded"
                      animation={animation}
                      speed={speed}
                    />
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {Array.from({ length: rows }).map((_, rIndex) => (
              <SkeletonTableRow
                key={rIndex}
                columns={columns}
                columnWidths={columnWidths}
                animation={animation}
                speed={speed}
                className={dense ? 'py-2' : ''}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination placeholder */}
      {hasPagination && (
        <div className="p-3 sm:p-4 border-t border-[var(--border,#e2e8f0)] flex flex-wrap items-center justify-between gap-3">
          <Skeleton variant="rounded" height="14px" width="140px" animation={animation} speed={speed} />
          <div className="flex items-center gap-1.5">
            <Skeleton variant="rounded" height="32px" width="32px" className="rounded-lg" animation={animation} speed={speed} />
            <Skeleton variant="rounded" height="32px" width="32px" className="rounded-lg" animation={animation} speed={speed} />
            <Skeleton variant="rounded" height="32px" width="32px" className="rounded-lg" animation={animation} speed={speed} />
            <Skeleton variant="rounded" height="32px" width="32px" className="rounded-lg" animation={animation} speed={speed} />
          </div>
        </div>
      )}
    </div>
  );
};
