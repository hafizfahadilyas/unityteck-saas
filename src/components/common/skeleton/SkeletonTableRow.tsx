import React from 'react';
import type { SkeletonTableRowProps } from './types';
import { Skeleton } from './Skeleton';

export const SkeletonTableRow: React.FC<SkeletonTableRowProps> = ({
  columns = 5,
  columnWidths,
  alignments,
  className = '',
  style,
  animation,
  speed,
}) => {
  return (
    <tr
      className={`border-t border-[var(--border,#e2e8f0)] transition-colors ${className}`}
      style={style}
      aria-hidden="true"
    >
      {Array.from({ length: columns }).map((_, colIndex) => {
        const align = alignments?.[colIndex] || 'left';
        const alignClass =
          align === 'right' ? 'text-end justify-end' : align === 'center' ? 'text-center justify-center' : 'text-start justify-start';
        const width = columnWidths?.[colIndex] || (colIndex === 0 ? '70%' : colIndex === columns - 1 ? '50%' : '60%');

        return (
          <td key={colIndex} className="py-3.5 px-3">
            <div className={`flex items-center ${alignClass}`}>
              <Skeleton
                variant="rounded"
                height="14px"
                width={width}
                animation={animation}
                speed={speed}
                className="rounded-md"
              />
            </div>
          </td>
        );
      })}
    </tr>
  );
};
