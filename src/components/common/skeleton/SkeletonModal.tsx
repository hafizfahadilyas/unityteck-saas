import React from 'react';
import type { SkeletonModalProps } from './types';
import { Skeleton } from './Skeleton';
import { SkeletonText } from './SkeletonText';

const sizeMap = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-6xl',
};

export const SkeletonModal: React.FC<SkeletonModalProps> = ({
  size = 'md',
  hasHeader = true,
  hasFooter = true,
  lines = 4,
  className = '',
  style,
  animation,
  speed,
}) => {
  const maxWClass = sizeMap[size];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in-50 duration-200"
      aria-busy="true"
      role="dialog"
      aria-modal="true"
      aria-label="Loading modal dialog…"
    >
      <div
        className={`w-full bg-[var(--surface,#ffffff)] border border-[var(--border,#e2e8f0)] rounded-3xl shadow-2xl overflow-hidden flex flex-col ${maxWClass} ${className}`}
        style={style}
      >
        {/* Modal Header */}
        {hasHeader && (
          <div className="p-5 border-b border-[var(--border,#e2e8f0)] flex items-center justify-between">
            <div className="space-y-1.5 flex-1">
              <Skeleton variant="rounded" height="20px" width="50%" animation={animation} speed={speed} />
              <Skeleton variant="rounded" height="12px" width="30%" animation={animation} speed={speed} />
            </div>
            <Skeleton variant="circular" width="32px" height="32px" animation={animation} speed={speed} />
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <SkeletonText lines={lines} animation={animation} speed={speed} size="base" />
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Skeleton variant="rounded" height="42px" className="rounded-xl" animation={animation} speed={speed} />
            <Skeleton variant="rounded" height="42px" className="rounded-xl" animation={animation} speed={speed} />
          </div>
        </div>

        {/* Modal Footer */}
        {hasFooter && (
          <div className="p-4 bg-[color-mix(in_srgb,var(--bg,#f8fafc)_50%,var(--surface,#ffffff))] border-t border-[var(--border,#e2e8f0)] flex items-center justify-end gap-3">
            <Skeleton variant="rounded" height="40px" width="90px" className="rounded-xl" animation={animation} speed={speed} />
            <Skeleton variant="rounded" height="40px" width="120px" className="rounded-xl" animation={animation} speed={speed} />
          </div>
        )}
      </div>
    </div>
  );
};
