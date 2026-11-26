import React from 'react';
import type { SkeletonSidebarProps } from './types';
import { Skeleton } from './Skeleton';

export const SkeletonSidebar: React.FC<SkeletonSidebarProps> = ({
  itemCount = 8,
  collapsed = false,
  hasLogo = true,
  hasUser = true,
  hasFooter = true,
  className = '',
  style,
  animation,
  speed,
}) => {
  return (
    <aside
      className={`h-full bg-[var(--surface,#ffffff)] border-e border-[var(--border,#e2e8f0)] flex flex-col justify-between ${
        collapsed ? 'w-16 p-2' : 'w-64 p-4'
      } ${className}`}
      style={style}
      aria-busy="true"
      role="status"
      aria-label="Loading sidebar…"
    >
      <div className="space-y-6">
        {/* Logo / Brand header */}
        {hasLogo && (
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : 'px-2'}`}>
            <Skeleton variant="rounded" width="36px" height="36px" className="rounded-xl shrink-0" animation={animation} speed={speed} />
            {!collapsed && (
              <div className="space-y-1.5 flex-1">
                <Skeleton variant="rounded" height="15px" width="70%" animation={animation} speed={speed} />
                <Skeleton variant="rounded" height="10px" width="45%" animation={animation} speed={speed} />
              </div>
            )}
          </div>
        )}

        {/* Store Switcher box */}
        {!collapsed && (
          <Skeleton
            variant="rounded"
            height="44px"
            width="100%"
            className="rounded-xl"
            animation={animation}
            speed={speed}
          />
        )}

        {/* Navigation list */}
        <div className="space-y-2 pt-2">
          {!collapsed && (
            <Skeleton variant="rounded" height="10px" width="30%" className="mx-2 mb-3 opacity-60" animation={animation} speed={speed} />
          )}

          {Array.from({ length: itemCount }).map((_, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 rounded-xl p-2.5 ${
                collapsed ? 'justify-center' : ''
              }`}
            >
              <Skeleton
                variant="rounded"
                width="20px"
                height="20px"
                className="rounded-lg shrink-0"
                animation={animation}
                speed={speed}
              />
              {!collapsed && (
                <Skeleton
                  variant="rounded"
                  height="14px"
                  width={i % 3 === 0 ? '75%' : i % 3 === 1 ? '55%' : '65%'}
                  animation={animation}
                  speed={speed}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* User profile / Footer */}
      {(hasUser || hasFooter) && (
        <div className="pt-4 border-t border-[var(--border,#e2e8f0)] space-y-3">
          {hasUser && (
            <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : 'px-1'}`}>
              <Skeleton variant="circular" width="36px" height="36px" className="shrink-0" animation={animation} speed={speed} />
              {!collapsed && (
                <div className="space-y-1.5 flex-1">
                  <Skeleton variant="rounded" height="13px" width="70%" animation={animation} speed={speed} />
                  <Skeleton variant="rounded" height="10px" width="50%" animation={animation} speed={speed} />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
