import React from 'react';

type GridProps = {
  count?: number;
  className?: string;
};

/** Single product card shimmer */
export function AlsaeediProductCardSkeleton() {
  return (
    <div className="alsaeedi-skeleton-card alsaeedi-card rounded-2xl sm:rounded-3xl p-3 sm:p-4 overflow-hidden">
      <div className="alsaeedi-skeleton aspect-square rounded-xl sm:rounded-2xl" />
      <div className="mt-3 space-y-2">
        <div className="alsaeedi-skeleton h-3 w-1/3 rounded-full" />
        <div className="alsaeedi-skeleton h-4 w-3/4 rounded-full" />
        <div className="alsaeedi-skeleton h-3 w-2/3 rounded-full" />
        <div className="flex items-center justify-between pt-2">
          <div className="alsaeedi-skeleton h-5 w-16 rounded-full" />
          <div className="alsaeedi-skeleton h-8 w-20 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function AlsaeediProductGridSkeleton({ count = 4, className = '' }: GridProps) {
  return (
    <div
      className={`grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 ${className}`}
      aria-busy="true"
      aria-live="polite"
    >
      {Array.from({ length: count }).map((_, i) => (
        <AlsaeediProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function AlsaeediSeatGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
      aria-busy="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <AlsaeediProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function AlsaeediBrandsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3" aria-busy="true">
      {Array.from({ length: 14 }).map((_, i) => (
        <div
          key={i}
          className="alsaeedi-skeleton-card alsaeedi-card p-3 sm:p-3.5 rounded-2xl flex flex-col items-center gap-2"
        >
          <div className="alsaeedi-skeleton w-12 h-12 rounded-full" />
          <div className="alsaeedi-skeleton h-3 w-14 rounded-full" />
          <div className="alsaeedi-skeleton h-2.5 w-10 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function AlsaeediServicesSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="alsaeedi-skeleton-card alsaeedi-card p-4 rounded-2xl space-y-3">
            <div className="alsaeedi-skeleton h-4 w-3/4 rounded-full" />
            <div className="alsaeedi-skeleton h-3 w-full rounded-full" />
            <div className="alsaeedi-skeleton h-3 w-2/3 rounded-full" />
            <div className="flex gap-3 pt-1">
              <div className="alsaeedi-skeleton h-3 w-14 rounded-full" />
              <div className="alsaeedi-skeleton h-3 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
      <div className="alsaeedi-skeleton-card alsaeedi-card-panel rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="alsaeedi-skeleton h-4 w-32 rounded-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="alsaeedi-skeleton h-11 rounded-xl" />
          <div className="alsaeedi-skeleton h-11 rounded-xl" />
        </div>
        <div className="alsaeedi-skeleton h-11 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="alsaeedi-skeleton h-11 rounded-xl" />
          <div className="alsaeedi-skeleton h-11 rounded-xl" />
          <div className="alsaeedi-skeleton h-11 rounded-xl" />
        </div>
        <div className="alsaeedi-skeleton h-12 rounded-xl" />
      </div>
    </div>
  );
}

export function AlsaeediReviewsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4" aria-busy="true">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="alsaeedi-skeleton-card alsaeedi-card p-5 rounded-2xl space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="alsaeedi-skeleton w-9 h-9 rounded-full" />
            <div className="space-y-1.5 flex-1">
              <div className="alsaeedi-skeleton h-3 w-24 rounded-full" />
              <div className="alsaeedi-skeleton h-2.5 w-32 rounded-full" />
            </div>
          </div>
          <div className="alsaeedi-skeleton h-3 w-full rounded-full" />
          <div className="alsaeedi-skeleton h-3 w-3/4 rounded-full" />
          <div className="alsaeedi-skeleton h-3 w-2/3 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function AlsaeediCatalogSkeleton({ count = 8 }: { count?: number }) {
  return <AlsaeediProductGridSkeleton count={count} />;
}
