import React from 'react';
import type { SkeletonButtonProps } from './types';
import { Skeleton } from './Skeleton';

const sizeMap = {
  xs: { height: '28px', width: '70px', textH: '8px' },
  sm: { height: '34px', width: '90px', textH: '10px' },
  md: { height: '42px', width: '120px', textH: '12px' },
  lg: { height: '50px', width: '160px', textH: '14px' },
};

const roundedMap = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
};

export const SkeletonButton: React.FC<SkeletonButtonProps> = ({
  size = 'md',
  width,
  fullWidth = false,
  rounded = 'xl',
  className = '',
  style,
  animation,
  speed,
}) => {
  const current = sizeMap[size];
  const roundClass = roundedMap[rounded];

  return (
    <Skeleton
      variant="rounded"
      width={fullWidth ? '100%' : width || current.width}
      height={current.height}
      animation={animation}
      speed={speed}
      className={`${roundClass} ${className}`}
      style={style}
    />
  );
};
