import React from 'react';
import type { SkeletonDashboardProps } from './types';
import { Skeleton } from './Skeleton';
import { SkeletonChart } from './SkeletonChart';
import { SkeletonTable } from './SkeletonTable';

export const SkeletonDashboard: React.FC<SkeletonDashboardProps> = ({
  statCardsCount = 4,
  hasCharts = true,
  hasRecentOrders = true,
  hasActivities = true,
  className = '',
  style,
  animation,
  speed,
}) => {
  return (
    <div
      className={`w-full space-y-6 animate-in fade-in-50 duration-200 ${className}`}
      style={style}
      aria-busy="true"
      role="status"
      aria-label="Loading dashboard…"
    >
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton variant="rounded" height="28px" width="220px" animation={animation} speed={speed} />
          <Skeleton variant="rounded" height="14px" width="320px" animation={animation} speed={speed} className="opacity-75" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton variant="rounded" height="38px" width="130px" className="rounded-xl" animation={animation} speed={speed} />
          <Skeleton variant="rounded" height="38px" width="110px" className="rounded-xl" animation={animation} speed={speed} />
        </div>
      </div>

      {/* KPI Statistic Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: statCardsCount }).map((_, idx) => (
          <div
            key={idx}
            className="souq-skeleton-card p-4 sm:p-5 flex flex-col justify-between gap-4"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1.5 flex-1">
                <Skeleton variant="rounded" height="12px" width="55%" animation={animation} speed={speed} />
                <Skeleton variant="rounded" height="26px" width="70%" animation={animation} speed={speed} />
              </div>
              <Skeleton variant="rounded" width="40px" height="40px" className="rounded-2xl shrink-0" animation={animation} speed={speed} />
            </div>
            <div className="flex items-center justify-between pt-1">
              <Skeleton variant="pill" height="18px" width="60px" animation={animation} speed={speed} />
              <Skeleton variant="rounded" height="16px" width="70px" animation={animation} speed={speed} />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      {hasCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <SkeletonChart type="area" height="340px" animation={animation} speed={speed} />
          </div>
          <div>
            <SkeletonChart type="donut" height="340px" animation={animation} speed={speed} />
          </div>
        </div>
      )}

      {/* Bottom Section: Orders Table + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {hasRecentOrders && (
          <div className={hasActivities ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <SkeletonTable rows={4} columns={5} hasToolbar={false} hasPagination={false} animation={animation} speed={speed} />
          </div>
        )}

        {hasActivities && (
          <div className="souq-skeleton-card p-4 sm:p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border,#e2e8f0)]">
              <Skeleton variant="rounded" height="18px" width="50%" animation={animation} speed={speed} />
              <Skeleton variant="rounded" height="14px" width="40px" animation={animation} speed={speed} />
            </div>
            <div className="space-y-3.5">
              {Array.from({ length: 4 }).map((_, aIdx) => (
                <div key={aIdx} className="flex items-start gap-3">
                  <Skeleton variant="circular" width="32px" height="32px" className="shrink-0" animation={animation} speed={speed} />
                  <div className="space-y-1 flex-1">
                    <Skeleton variant="rounded" height="13px" width="90%" animation={animation} speed={speed} />
                    <Skeleton variant="rounded" height="10px" width="45%" animation={animation} speed={speed} className="opacity-70" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
