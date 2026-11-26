import React from 'react';
import type { SkeletonProps, SkeletonVariant } from './types';
import { useSkeletonConfig } from './SkeletonConfigContext';

const variantClasses: Record<SkeletonVariant, string> = {
  rectangular: 'rounded-none',
  rounded: 'rounded-xl',
  circular: 'rounded-full',
  pill: 'rounded-full',
};

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rounded',
  width,
  height,
  className = '',
  style,
  animation: animationProp,
  speed: speedProp,
  'aria-label': ariaLabel = 'Loading content…',
  children,
}) => {
  const config = useSkeletonConfig();

  // If globally disabled, render minimal transparent placeholder or children
  if (!config.enabled) {
    return <div className={`opacity-0 ${className}`} style={{ width, height, ...style }} />;
  }

  const effectiveAnimation =
    config.reducedMotion
      ? 'none'
      : animationProp || config.animation || 'shimmer';

  const effectiveSpeed = speedProp || config.speed || 'normal';

  const animClass =
    effectiveAnimation === 'shimmer'
      ? 'souq-skeleton-shimmer'
      : effectiveAnimation === 'pulse'
        ? 'souq-skeleton-pulse'
        : 'souq-skeleton-none';

  const speedClass =
    effectiveSpeed === 'slow'
      ? 'souq-skeleton-speed-slow'
      : effectiveSpeed === 'fast'
        ? 'souq-skeleton-speed-fast'
        : '';

  const inlineStyles: React.CSSProperties = {
    ...style,
    ...(width !== undefined ? { width: typeof width === 'number' ? `${width}px` : width } : {}),
    ...(height !== undefined ? { height: typeof height === 'number' ? `${height}px` : height } : {}),
  };

  return (
    <div
      role="status"
      aria-label={ariaLabel}
      aria-busy="true"
      className={`souq-skeleton ${variantClasses[variant]} ${animClass} ${speedClass} ${className}`.trim()}
      style={inlineStyles}
    >
      {children}
    </div>
  );
};
