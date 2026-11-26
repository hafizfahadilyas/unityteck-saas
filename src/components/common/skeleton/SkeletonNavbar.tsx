import React from 'react';
import type { SkeletonNavbarProps } from './types';
import { Skeleton } from './Skeleton';

export const SkeletonNavbar: React.FC<SkeletonNavbarProps> = ({
  hasSearch = true,
  hasActions = true,
  hasStoreSwitcher = true,
  hasAvatar = true,
  className = '',
  style,
  animation,
  speed,
}) => {
  return (
    <header
      className={`h-16 px-4 sm:px-6 bg-[var(--surface,#ffffff)] border-b border-[var(--border,#e2e8f0)] flex items-center justify-between gap-4 w-full ${className}`}
      style={style}
      aria-busy="true"
      role="status"
      aria-label="Loading top navigation…"
    >
      {/* Left / Search area */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <Skeleton variant="rounded" width="36px" height="36px" className="rounded-xl lg:hidden" animation={animation} speed={speed} />
        {hasSearch && (
          <Skeleton
            variant="rounded"
            height="40px"
            width="100%"
            className="rounded-2xl"
            animation={animation}
            speed={speed}
          />
        )}
      </div>

      {/* Right / Actions area */}
      <div className="flex items-center gap-3">
        {hasStoreSwitcher && (
          <Skeleton
            variant="rounded"
            height="38px"
            width="140px"
            className="rounded-xl hidden sm:block"
            animation={animation}
            speed={speed}
          />
        )}

        {hasActions && (
          <div className="flex items-center gap-2">
            <Skeleton variant="circular" width="36px" height="36px" animation={animation} speed={speed} />
            <Skeleton variant="circular" width="36px" height="36px" animation={animation} speed={speed} />
          </div>
        )}

        {hasAvatar && (
          <div className="flex items-center gap-2.5 ps-2 border-s border-[var(--border,#e2e8f0)]">
            <Skeleton variant="circular" width="38px" height="38px" animation={animation} speed={speed} />
            <div className="space-y-1 hidden md:block">
              <Skeleton variant="rounded" height="13px" width="80px" animation={animation} speed={speed} />
              <Skeleton variant="rounded" height="10px" width="50px" animation={animation} speed={speed} />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
