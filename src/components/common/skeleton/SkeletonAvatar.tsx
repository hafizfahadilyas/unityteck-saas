import React from 'react';
import type { SkeletonAvatarProps } from './types';
import { Skeleton } from './Skeleton';

const sizeMap = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
};

export const SkeletonAvatar: React.FC<SkeletonAvatarProps> = ({
  size = 'md',
  shape = 'circle',
  className = '',
  style,
  animation,
  speed,
}) => {
  const px = typeof size === 'number' ? size : sizeMap[size];
  const variant = shape === 'circle' ? 'circular' : shape === 'rounded' ? 'rounded' : 'rectangular';

  return (
    <Skeleton
      variant={variant}
      width={px}
      height={px}
      animation={animation}
      speed={speed}
      className={`shrink-0 ${shape === 'rounded' ? 'rounded-2xl' : ''} ${className}`}
      style={style}
    />
  );
};
