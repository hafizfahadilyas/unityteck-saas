import React from 'react';
import type { SkeletonFormProps } from './types';
import { Skeleton } from './Skeleton';

const colClasses: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
};

export const SkeletonForm: React.FC<SkeletonFormProps> = ({
  fieldsCount = 6,
  columns = 2,
  hasActions = true,
  className = '',
  style,
  animation,
  speed,
}) => {
  const gridColClass = colClasses[columns] || colClasses[2];

  return (
    <div
      className={`souq-skeleton-card p-5 sm:p-6 space-y-6 ${className}`}
      style={style}
      aria-busy="true"
      role="status"
      aria-label="Loading form…"
    >
      <div className={`grid gap-4 sm:gap-5 ${gridColClass}`}>
        {Array.from({ length: fieldsCount }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton variant="rounded" height="13px" width="30%" animation={animation} speed={speed} />
            <Skeleton
              variant="rounded"
              height={i === fieldsCount - 1 && columns === 1 ? '80px' : '44px'}
              width="100%"
              className="rounded-xl"
              animation={animation}
              speed={speed}
            />
          </div>
        ))}
      </div>

      {hasActions && (
        <div className="pt-4 border-t border-[var(--border,#e2e8f0)] flex items-center justify-end gap-3">
          <Skeleton variant="rounded" height="42px" width="100px" className="rounded-xl" animation={animation} speed={speed} />
          <Skeleton variant="rounded" height="42px" width="130px" className="rounded-xl" animation={animation} speed={speed} />
        </div>
      )}
    </div>
  );
};
