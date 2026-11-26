import React from 'react';
import type { SkeletonPageProps } from './types';
import { Skeleton } from './Skeleton';
import { SkeletonDashboard } from './SkeletonDashboard';
import { SkeletonTable } from './SkeletonTable';
import { SkeletonProductGrid } from './SkeletonProductGrid';
import { SkeletonForm } from './SkeletonForm';

export const SkeletonPage: React.FC<SkeletonPageProps> = ({
  layout = 'dashboard',
  hasHeader = true,
  hasTabs = false,
  className = '',
  style,
  animation,
  speed,
}) => {
  return (
    <div
      className={`w-full min-h-[50vh] p-4 sm:p-6 lg:p-8 space-y-6 ${className}`}
      style={style}
      aria-busy="true"
      role="status"
      aria-label="Loading page content…"
    >
      {/* Top Page Header */}
      {hasHeader && (
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--border,#e2e8f0)]">
          <div className="space-y-2">
            <Skeleton variant="rounded" height="26px" width="200px" animation={animation} speed={speed} />
            <Skeleton variant="rounded" height="13px" width="300px" animation={animation} speed={speed} className="opacity-70" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton variant="rounded" height="40px" width="110px" className="rounded-xl" animation={animation} speed={speed} />
            <Skeleton variant="rounded" height="40px" width="130px" className="rounded-xl" animation={animation} speed={speed} />
          </div>
        </div>
      )}

      {/* Tabs navigation bar */}
      {hasTabs && (
        <div className="flex items-center gap-2 border-b border-[var(--border,#e2e8f0)] pb-2">
          <Skeleton variant="rounded" height="34px" width="90px" className="rounded-lg" animation={animation} speed={speed} />
          <Skeleton variant="rounded" height="34px" width="90px" className="rounded-lg" animation={animation} speed={speed} />
          <Skeleton variant="rounded" height="34px" width="90px" className="rounded-lg" animation={animation} speed={speed} />
        </div>
      )}

      {/* Layout Content */}
      {layout === 'dashboard' && (
        <SkeletonDashboard animation={animation} speed={speed} />
      )}

      {layout === 'table' && (
        <SkeletonTable rows={8} columns={5} animation={animation} speed={speed} />
      )}

      {layout === 'cards' && (
        <SkeletonProductGrid count={8} columns={4} animation={animation} speed={speed} />
      )}

      {layout === 'form' && (
        <SkeletonForm fieldsCount={8} columns={2} animation={animation} speed={speed} />
      )}

      {layout === 'storefront' && (
        <div className="space-y-8">
          {/* Hero Banner */}
          <Skeleton variant="rounded" height="320px" width="100%" className="rounded-3xl" animation={animation} speed={speed} />
          {/* Category Carousel */}
          <div className="flex items-center gap-4 overflow-hidden py-2">
            {Array.from({ length: 6 }).map((_, cIdx) => (
              <div key={cIdx} className="flex flex-col items-center gap-2 shrink-0">
                <Skeleton variant="circular" width="70px" height="70px" animation={animation} speed={speed} />
                <Skeleton variant="rounded" height="12px" width="50px" animation={animation} speed={speed} />
              </div>
            ))}
          </div>
          {/* Product Grid */}
          <SkeletonProductGrid count={8} columns={4} animation={animation} speed={speed} />
        </div>
      )}
    </div>
  );
};
