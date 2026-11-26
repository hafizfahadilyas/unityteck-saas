import React from 'react';
import type { SkeletonProductGridProps } from './types';
import { SkeletonProductCard } from './SkeletonProductCard';

const colClasses: Record<number | string, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  5: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
  6: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6',
  auto: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5',
};

const gapClasses = {
  sm: 'gap-3 sm:gap-4',
  md: 'gap-4 sm:gap-5',
  lg: 'gap-5 sm:gap-6',
};

export const SkeletonProductGrid: React.FC<SkeletonProductGridProps> = ({
  count = 8,
  columns = 4,
  variant = 'grid',
  gap = 'md',
  className = '',
  style,
  animation,
  speed,
}) => {
  const gridColClass = colClasses[columns] || colClasses[4];
  const gridGapClass = gapClasses[gap];

  return (
    <div
      className={`grid w-full ${gridColClass} ${gridGapClass} ${className}`}
      style={style}
      aria-busy="true"
      role="status"
      aria-label="Loading products catalog…"
    >
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonProductCard
          key={index}
          variant={variant}
          animation={animation}
          speed={speed}
        />
      ))}
    </div>
  );
};
