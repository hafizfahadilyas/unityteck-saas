import React from 'react';
import type { SkeletonProductCardProps } from './types';
import { Skeleton } from './Skeleton';
import { SkeletonImage } from './SkeletonImage';

export const SkeletonProductCard: React.FC<SkeletonProductCardProps> = ({
  variant = 'grid',
  imageAspectRatio = 'square',
  showRating = true,
  showButton = true,
  showVendor = true,
  className = '',
  style,
  animation,
  speed,
}) => {
  if (variant === 'horizontal') {
    return (
      <div
        className={`souq-skeleton-card p-3 sm:p-4 flex gap-4 items-center overflow-hidden ${className}`}
        style={style}
        aria-busy="true"
      >
        <div className="w-20 sm:w-24 shrink-0">
          <SkeletonImage
            aspectRatio="square"
            rounded="xl"
            animation={animation}
            speed={speed}
            showIcon={false}
          />
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          {showVendor && (
            <Skeleton variant="rounded" height="10px" width="30%" animation={animation} speed={speed} />
          )}
          <Skeleton variant="rounded" height="15px" width="75%" animation={animation} speed={speed} />
          <Skeleton variant="rounded" height="12px" width="45%" animation={animation} speed={speed} />
          <div className="flex items-center justify-between pt-1">
            <Skeleton variant="rounded" height="18px" width="60px" animation={animation} speed={speed} />
            {showButton && (
              <Skeleton variant="rounded" height="32px" width="80px" className="rounded-xl" animation={animation} speed={speed} />
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        className={`souq-skeleton-card p-2.5 sm:p-3 flex flex-col gap-2 overflow-hidden ${className}`}
        style={style}
        aria-busy="true"
      >
        <SkeletonImage
          aspectRatio="square"
          rounded="lg"
          animation={animation}
          speed={speed}
          showIcon={false}
        />
        <Skeleton variant="rounded" height="13px" width="80%" animation={animation} speed={speed} />
        <div className="flex items-center justify-between">
          <Skeleton variant="rounded" height="14px" width="50px" animation={animation} speed={speed} />
          {showButton && (
            <Skeleton variant="circular" width="24px" height="24px" animation={animation} speed={speed} />
          )}
        </div>
      </div>
    );
  }

  // Default 'grid' & 'luxury' variants
  const isLuxury = variant === 'luxury';

  return (
    <div
      className={`souq-skeleton-card ${
        isLuxury ? 'rounded-2xl sm:rounded-3xl p-3 sm:p-4' : 'rounded-2xl p-3 sm:p-4'
      } flex flex-col gap-3 overflow-hidden ${className}`}
      style={style}
      aria-busy="true"
    >
      {/* Product Image */}
      <SkeletonImage
        aspectRatio={imageAspectRatio}
        rounded={isLuxury ? '2xl' : 'xl'}
        animation={animation}
        speed={speed}
        showIcon={true}
      />

      {/* Meta + Title + Price */}
      <div className="space-y-2 flex-1 flex flex-col justify-between pt-1">
        <div className="space-y-2">
          {showVendor && (
            <div className="flex items-center justify-between">
              <Skeleton variant="rounded" height="11px" width="35%" animation={animation} speed={speed} />
              {showRating && (
                <Skeleton variant="rounded" height="11px" width="40px" animation={animation} speed={speed} />
              )}
            </div>
          )}

          {/* Title lines */}
          <Skeleton variant="rounded" height="15px" width="90%" animation={animation} speed={speed} />
          <Skeleton variant="rounded" height="13px" width="60%" animation={animation} speed={speed} />
        </div>

        {/* Price & Action */}
        <div className="pt-2 flex items-center justify-between gap-2">
          <div className="space-y-1">
            <Skeleton variant="rounded" height="18px" width="70px" animation={animation} speed={speed} />
            <Skeleton variant="rounded" height="10px" width="45px" animation={animation} speed={speed} className="opacity-60" />
          </div>

          {showButton && (
            <Skeleton
              variant="rounded"
              height={isLuxury ? '38px' : '36px'}
              width={isLuxury ? '90px' : '80px'}
              className={isLuxury ? 'rounded-2xl' : 'rounded-xl'}
              animation={animation}
              speed={speed}
            />
          )}
        </div>
      </div>
    </div>
  );
};
