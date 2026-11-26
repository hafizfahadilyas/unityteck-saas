import React from 'react';
import type { SkeletonTextProps } from './types';
import { Skeleton } from './Skeleton';

const sizeMap = {
  xs: { height: '10px', mb: 'mb-1.5' },
  sm: { height: '12px', mb: 'mb-2' },
  base: { height: '16px', mb: 'mb-2.5' },
  lg: { height: '20px', mb: 'mb-3' },
  xl: { height: '24px', mb: 'mb-3.5' },
};

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  lastLineWidth = '65%',
  gap,
  lineHeight,
  size = 'base',
  className = '',
  style,
  animation,
  speed,
}) => {
  const currentSize = sizeMap[size];
  const effectiveHeight = lineHeight || currentSize.height;

  return (
    <div className={`w-full flex flex-col ${className}`} style={style} aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => {
        const isLast = index === lines - 1;
        const width = isLast && lines > 1 ? lastLineWidth : index % 2 === 1 ? '92%' : '100%';
        const marginStyle = !isLast && gap ? { marginBottom: typeof gap === 'number' ? `${gap}px` : gap } : {};

        return (
          <Skeleton
            key={index}
            variant="rounded"
            height={effectiveHeight}
            width={width}
            animation={animation}
            speed={speed}
            className={`rounded-md ${!isLast && !gap ? currentSize.mb : ''}`}
            style={marginStyle}
          />
        );
      })}
    </div>
  );
};
