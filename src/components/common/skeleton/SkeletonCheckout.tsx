import React from 'react';
import type { SkeletonCheckoutProps } from './types';
import { Skeleton } from './Skeleton';

export const SkeletonCheckout: React.FC<SkeletonCheckoutProps> = ({
  hasSidebar = true,
  className = '',
  style,
  animation,
  speed,
}) => {
  return (
    <div
      className={`w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 ${className}`}
      style={style}
      aria-busy="true"
      role="status"
      aria-label="Loading checkout…"
    >
      {/* Left/Main Column: Delivery Address, Shipping, Payment */}
      <div className={hasSidebar ? 'lg:col-span-7 xl:col-span-8 space-y-6' : 'lg:col-span-12 space-y-6'}>
        {/* Step 1: Customer Contact info */}
        <div className="souq-skeleton-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton variant="circular" width="28px" height="28px" animation={animation} speed={speed} />
            <Skeleton variant="rounded" height="18px" width="160px" animation={animation} speed={speed} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <Skeleton variant="rounded" height="42px" className="rounded-xl" animation={animation} speed={speed} />
            <Skeleton variant="rounded" height="42px" className="rounded-xl" animation={animation} speed={speed} />
          </div>
        </div>

        {/* Step 2: Shipping Address */}
        <div className="souq-skeleton-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton variant="circular" width="28px" height="28px" animation={animation} speed={speed} />
            <Skeleton variant="rounded" height="18px" width="180px" animation={animation} speed={speed} />
          </div>
          <div className="space-y-3 pt-2">
            <Skeleton variant="rounded" height="42px" className="rounded-xl" animation={animation} speed={speed} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Skeleton variant="rounded" height="42px" className="rounded-xl" animation={animation} speed={speed} />
              <Skeleton variant="rounded" height="42px" className="rounded-xl" animation={animation} speed={speed} />
              <Skeleton variant="rounded" height="42px" className="rounded-xl" animation={animation} speed={speed} />
            </div>
          </div>
        </div>

        {/* Step 3: Payment Method Options */}
        <div className="souq-skeleton-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton variant="circular" width="28px" height="28px" animation={animation} speed={speed} />
            <Skeleton variant="rounded" height="18px" width="150px" animation={animation} speed={speed} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {Array.from({ length: 4 }).map((_, pIdx) => (
              <div key={pIdx} className="p-3 border border-[var(--border,#e2e8f0)] rounded-2xl flex flex-col items-center gap-2">
                <Skeleton variant="rounded" width="48px" height="28px" className="rounded-md" animation={animation} speed={speed} />
                <Skeleton variant="rounded" height="12px" width="60%" animation={animation} speed={speed} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Order Summary Sidebar */}
      {hasSidebar && (
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="souq-skeleton-card p-5 sm:p-6 space-y-5 sticky top-6">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border,#e2e8f0)]">
              <Skeleton variant="rounded" height="20px" width="140px" animation={animation} speed={speed} />
              <Skeleton variant="rounded" height="14px" width="50px" animation={animation} speed={speed} />
            </div>

            {/* Cart Items list */}
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, itemIdx) => (
                <div key={itemIdx} className="flex gap-3 items-center">
                  <Skeleton variant="rounded" width="54px" height="54px" className="rounded-xl shrink-0" animation={animation} speed={speed} />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton variant="rounded" height="14px" width="85%" animation={animation} speed={speed} />
                    <Skeleton variant="rounded" height="12px" width="50%" animation={animation} speed={speed} />
                  </div>
                  <Skeleton variant="rounded" height="16px" width="55px" animation={animation} speed={speed} />
                </div>
              ))}
            </div>

            {/* Price breakdown */}
            <div className="pt-4 border-t border-[var(--border,#e2e8f0)] space-y-2.5">
              <div className="flex justify-between">
                <Skeleton variant="rounded" height="13px" width="70px" animation={animation} speed={speed} />
                <Skeleton variant="rounded" height="13px" width="50px" animation={animation} speed={speed} />
              </div>
              <div className="flex justify-between">
                <Skeleton variant="rounded" height="13px" width="80px" animation={animation} speed={speed} />
                <Skeleton variant="rounded" height="13px" width="45px" animation={animation} speed={speed} />
              </div>
              <div className="flex justify-between pt-2 border-t border-[var(--border,#e2e8f0)]">
                <Skeleton variant="rounded" height="18px" width="90px" animation={animation} speed={speed} />
                <Skeleton variant="rounded" height="20px" width="75px" animation={animation} speed={speed} />
              </div>
            </div>

            {/* Checkout Action Button */}
            <Skeleton variant="rounded" height="48px" width="100%" className="rounded-2xl" animation={animation} speed={speed} />
          </div>
        </div>
      )}
    </div>
  );
};
