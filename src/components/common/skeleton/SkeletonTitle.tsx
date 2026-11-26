import React from 'react';
import type { SkeletonTitleProps } from './types';
import { Skeleton } from './Skeleton';

const sizeMap = {
  sm: { titleH: '18px', titleW: '40%', subH: '12px', subW: '60%' },
  md: { titleH: '24px', titleW: '50%', subH: '14px', subW: '70%' },
  lg: { titleH: '32px', titleW: '60%', subH: '16px', subW: '75%' },
  xl: { titleH: '40px', titleW: '70%', subH: '18px', subW: '80%' },
};

export const SkeletonTitle: React.FC<SkeletonTitleProps> = ({
  withSubtitle = true,
  withBadge = false,
  size = 'md',
  className = '',
  style,
  animation,
  speed,
}) => {
  const current = sizeMap[size];

  return (
    <div className={`space-y-2 ${className}`} style={style} aria-hidden="true">
      <div className="flex items-center gap-3">
        <Skeleton
          variant="rounded"
          height={current.titleH}
          width={current.titleW}
          animation={animation}
          speed={speed}
          className="rounded-lg"
        />
        {withBadge && (
          <Skeleton
            variant="pill"
            height="22px"
            width="64px"
            animation={animation}
            speed={speed}
          />
        )}
      </div>
      {withSubtitle && (
        <Skeleton
          variant="rounded"
          height={current.subH}
          width={current.subW}
          animation={animation}
          speed={speed}
          className="rounded-md opacity-75"
        />
      )}
    </div>
  );
};
