import React from 'react';
import type { SkeletonImageProps } from './types';
import { Skeleton } from './Skeleton';
import { Image as ImageIcon } from 'lucide-react';

const aspectMap = {
  square: 'aspect-square',
  video: 'aspect-video',
  portrait: 'aspect-[3/4]',
  wide: 'aspect-[21/9]',
};

const roundedMap = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
  full: 'rounded-full',
};

export const SkeletonImage: React.FC<SkeletonImageProps> = ({
  aspectRatio = 'square',
  width = '100%',
  height,
  rounded = '2xl',
  showIcon = true,
  className = '',
  style,
  animation,
  speed,
}) => {
  const aspectClass = aspectMap[aspectRatio as keyof typeof aspectMap] || '';
  const roundClass = roundedMap[rounded];

  return (
    <Skeleton
      variant="rounded"
      width={width}
      height={height}
      animation={animation}
      speed={speed}
      className={`relative w-full overflow-hidden flex items-center justify-center ${aspectClass} ${roundClass} ${className}`}
      style={style}
    >
      {showIcon && (
        <ImageIcon className="w-8 h-8 opacity-25 text-slate-400 dark:text-slate-600 pointer-events-none select-none" />
      )}
    </Skeleton>
  );
};
