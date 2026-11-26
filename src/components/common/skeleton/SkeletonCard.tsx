import React from 'react';
import type { SkeletonCardProps } from './types';
import { Skeleton } from './Skeleton';
import { SkeletonText } from './SkeletonText';

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  hasHeader = true,
  hasFooter = false,
  hasMedia = false,
  mediaHeight = '180px',
  lines = 3,
  className = '',
  style,
  animation,
  speed,
  children,
}) => {
  return (
    <div
      className={`souq-skeleton-card p-4 sm:p-5 flex flex-col gap-4 overflow-hidden ${className}`}
      style={style}
      aria-busy="true"
    >
      {hasHeader && (
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-2 flex-1">
            <Skeleton variant="rounded" height="18px" width="55%" animation={animation} speed={speed} />
            <Skeleton variant="rounded" height="12px" width="35%" animation={animation} speed={speed} />
          </div>
          <Skeleton variant="circular" width="32px" height="32px" animation={animation} speed={speed} />
        </div>
      )}

      {hasMedia && (
        <Skeleton
          variant="rounded"
          height={mediaHeight}
          width="100%"
          className="rounded-xl"
          animation={animation}
          speed={speed}
        />
      )}

      {children ? (
        children
      ) : (
        <SkeletonText lines={lines} animation={animation} speed={speed} size="sm" />
      )}

      {hasFooter && (
        <div className="pt-2 border-t border-[var(--border,#e2e8f0)] flex items-center justify-between">
          <Skeleton variant="rounded" height="14px" width="30%" animation={animation} speed={speed} />
          <Skeleton variant="rounded" height="30px" width="75px" className="rounded-lg" animation={animation} speed={speed} />
        </div>
      )}
    </div>
  );
};
