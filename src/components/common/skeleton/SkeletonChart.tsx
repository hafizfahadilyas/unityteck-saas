import React from 'react';
import type { SkeletonChartProps } from './types';
import { Skeleton } from './Skeleton';

export const SkeletonChart: React.FC<SkeletonChartProps> = ({
  type = 'area',
  height = '280px',
  hasLegend = true,
  hasHeader = true,
  className = '',
  style,
  animation,
  speed,
}) => {
  return (
    <div
      className={`souq-skeleton-card p-4 sm:p-5 flex flex-col justify-between overflow-hidden ${className}`}
      style={{ minHeight: typeof height === 'number' ? `${height}px` : height, ...style }}
      aria-busy="true"
      role="status"
      aria-label="Loading chart…"
    >
      {/* Chart Header */}
      {hasHeader && (
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border,#e2e8f0)]">
          <div className="space-y-1.5 flex-1">
            <Skeleton variant="rounded" height="18px" width="40%" animation={animation} speed={speed} />
            <Skeleton variant="rounded" height="12px" width="25%" animation={animation} speed={speed} />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton variant="rounded" height="28px" width="80px" className="rounded-lg" animation={animation} speed={speed} />
          </div>
        </div>
      )}

      {/* Chart Body */}
      <div className="flex-1 flex items-end justify-between gap-3 sm:gap-4 pt-6 pb-2 px-2 min-h-[160px]">
        {type === 'donut' ? (
          <div className="w-full flex flex-col items-center justify-center gap-4 py-4">
            <div className="relative flex items-center justify-center">
              <Skeleton
                variant="circular"
                width="160px"
                height="160px"
                className="opacity-90"
                animation={animation}
                speed={speed}
              />
              <div className="absolute w-20 h-20 rounded-full bg-[var(--surface,#ffffff)] shadow-inner" />
            </div>
            {hasLegend && (
              <div className="flex items-center justify-center gap-4 pt-2">
                <Skeleton variant="rounded" height="12px" width="60px" animation={animation} speed={speed} />
                <Skeleton variant="rounded" height="12px" width="60px" animation={animation} speed={speed} />
                <Skeleton variant="rounded" height="12px" width="60px" animation={animation} speed={speed} />
              </div>
            )}
          </div>
        ) : (
          /* Bar / Area / Line bars */
          Array.from({ length: 8 }).map((_, i) => {
            const heights = ['40%', '65%', '50%', '85%', '70%', '95%', '60%', '80%'];
            const barH = heights[i % heights.length];

            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <Skeleton
                  variant="rounded"
                  width="100%"
                  height={barH}
                  className="rounded-t-lg max-w-[48px]"
                  animation={animation}
                  speed={speed}
                />
                <Skeleton
                  variant="rounded"
                  width="70%"
                  height="10px"
                  className="max-w-[32px] opacity-70"
                  animation={animation}
                  speed={speed}
                />
              </div>
            );
          })
        )}
      </div>

      {/* Chart Legend */}
      {hasLegend && type !== 'donut' && (
        <div className="flex items-center justify-center gap-6 pt-3 border-t border-[var(--border,#e2e8f0)]">
          <div className="flex items-center gap-2">
            <Skeleton variant="circular" width="10px" height="10px" animation={animation} speed={speed} />
            <Skeleton variant="rounded" height="12px" width="70px" animation={animation} speed={speed} />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton variant="circular" width="10px" height="10px" animation={animation} speed={speed} />
            <Skeleton variant="rounded" height="12px" width="70px" animation={animation} speed={speed} />
          </div>
        </div>
      )}
    </div>
  );
};
