import React from 'react';

interface CylinderBarItem {
  label: string;
  percentage: number;
  color?: string;
}

interface CylinderBarChartProps {
  items: CylinderBarItem[];
  height?: number;
}

/** Holst market-share cylinders — percentage capped, no overflow pillar. */
export const CylinderBarChart: React.FC<CylinderBarChartProps> = React.memo(({
  items,
  height = 150,
}) => {
  const safe = items.length ? items : [{ label: '—', percentage: 0 }];

  return (
    <div
      className="w-full flex items-end justify-around gap-2 px-1 overflow-hidden"
      style={{ height: height + 48, minHeight: height + 48 }}
    >
      {safe.map((item, idx) => {
        const pct = Math.max(0, Math.min(100, Number(item.percentage) || 0));
        const barHeight = Math.max(8, (pct / 100) * height);
        const fill = item.color || 'var(--accent)';

        return (
          <div key={`${item.label}-${idx}`} className="flex-1 min-w-0 flex flex-col items-center max-w-[4.5rem]">
            <span
              className="text-[10px] font-bold tabular-nums mb-1"
              style={{ color: 'var(--text)' }}
            >
              {pct}%
            </span>
            <div
              className="relative w-9 sm:w-10 rounded-t-full overflow-hidden"
              style={{
                height: barHeight,
                background: `linear-gradient(180deg, color-mix(in srgb, ${fill} 75%, #fff), ${fill})`,
                boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${fill} 40%, transparent)`,
              }}
              title={`${item.label}: ${pct}%`}
            >
              <span
                className="absolute inset-x-0 top-0 h-2.5 rounded-full"
                style={{
                  background: `color-mix(in srgb, ${fill} 45%, #fff)`,
                }}
              />
            </div>
            <span
              className="text-[10px] font-medium text-center mt-1.5 truncate w-full"
              style={{ color: 'var(--muted)' }}
              title={item.label}
            >
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
});

CylinderBarChart.displayName = 'CylinderBarChart';
