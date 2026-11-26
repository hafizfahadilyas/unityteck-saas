import React from 'react';
import type { SkeletonOrderListProps } from './types';
import { Skeleton } from './Skeleton';

export const SkeletonOrderList: React.FC<SkeletonOrderListProps> = ({
  count = 4,
  className = '',
  style,
  animation,
  speed,
}) => {
  return (
    <div
      className={`w-full space-y-4 ${className}`}
      style={style}
      aria-busy="true"
      role="status"
      aria-label="Loading orders list…"
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="souq-skeleton-card p-4 sm:p-5 flex flex-col gap-4 overflow-hidden"
        >
          {/* Order Header: ID, Date, Status */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--border,#e2e8f0)]">
            <div className="flex items-center gap-3">
              <Skeleton variant="rounded" height="20px" width="120px" animation={animation} speed={speed} />
              <Skeleton variant="pill" height="22px" width="80px" animation={animation} speed={speed} />
            </div>
            <Skeleton variant="rounded" height="14px" width="100px" animation={animation} speed={speed} />
          </div>

          {/* Order Content: Items & Price */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Skeleton variant="rounded" width="56px" height="56px" className="rounded-xl shrink-0" animation={animation} speed={speed} />
              <div className="space-y-1.5">
                <Skeleton variant="rounded" height="15px" width="180px" animation={animation} speed={speed} />
                <Skeleton variant="rounded" height="12px" width="110px" animation={animation} speed={speed} className="opacity-70" />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-end space-y-1">
                <Skeleton variant="rounded" height="18px" width="80px" animation={animation} speed={speed} />
                <Skeleton variant="rounded" height="11px" width="50px" animation={animation} speed={speed} className="opacity-70" />
              </div>
              <Skeleton variant="rounded" height="38px" width="90px" className="rounded-xl" animation={animation} speed={speed} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
