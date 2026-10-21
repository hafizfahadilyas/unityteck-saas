import React, { useState, useId } from 'react';

interface AreaChartProps {
  data: { label: string; value: number }[];
  color?: string;
  fillGradient?: [string, string];
  height?: number;
  prefix?: string;
  suffix?: string;
  showTooltip?: boolean;
}

export const AreaChart: React.FC<AreaChartProps> = React.memo(({
  data,
  color = '#00C9A7',
  fillGradient = ['#00C9A7', '#00C9A7'],
  height = 120,
  prefix = '',
  suffix = '',
  showTooltip = true,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const reactId = useId();
  const gradId = `area-grad-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  if (!data || data.length < 2) return null;

  const min = Math.min(...data.map(d => d.value));
  const max = Math.max(...data.map(d => d.value));
  const range = max - min === 0 ? 1 : max - min;

  const paddingX = 12;
  const paddingTop = 16;
  const paddingBottom = 16;
  const usableHeight = height - paddingTop - paddingBottom;
  const width = 400; // viewBox width
  const stepX = (width - paddingX * 2) / (data.length - 1);

  const points = data.map((item, idx) => {
    const x = paddingX + idx * stepX;
    const y = height - paddingBottom - ((item.value - min) / range) * usableHeight;
    return { x, y, ...item };
  });

  // Smooth cubic bezier curve generator
  let pathD = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    pathD += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }

  const areaD = `${pathD} L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z`;

  return (
    <div className="relative w-full min-w-0 overflow-hidden select-none touch-pan-y">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto max-h-[220px] sm:max-h-none overflow-visible"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Trend chart"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillGradient[0]} stopOpacity="0.35" />
            <stop offset="90%" stopColor={fillGradient[1]} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Shaded Area */}
        <path d={areaD} fill={`url(#${gradId})`} />

        {/* Stroke Line */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points & hover triggers */}
        {points.map((pt, idx) => (
          <g key={idx} className="cursor-pointer">
            <circle
              cx={pt.x}
              cy={pt.y}
              r={hoveredIndex === idx ? 5 : 2.5}
              fill="#ffffff"
              stroke={color}
              strokeWidth={hoveredIndex === idx ? 2.5 : 1.5}
              className="transition-all duration-150"
            />
            {/* invisible hover catchment area */}
            <rect
              x={pt.x - stepX / 2}
              y={0}
              width={stepX}
              height={height}
              fill="transparent"
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          </g>
        ))}
      </svg>

      {/* Floating tooltip */}
      {showTooltip && hoveredIndex !== null && (
        <div
          className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-full px-2.5 py-1 rounded-lg shadow-lg text-[11px] font-medium z-20 whitespace-nowrap border"
          style={{
            left: `${(points[hoveredIndex].x / width) * 100}%`,
            top: `${(points[hoveredIndex].y / height) * 100}%`,
            marginTop: '-8px',
            background: 'var(--portal-950)',
            color: 'var(--portal-50)',
            borderColor: 'color-mix(in srgb, var(--portal-400) 35%, transparent)',
          }}
        >
          <div className="font-semibold" style={{ color: 'var(--portal-200)' }}>
            {prefix}{points[hoveredIndex].value.toLocaleString()}{suffix}
          </div>
          <div className="text-[10px]" style={{ color: 'var(--portal-400)' }}>{points[hoveredIndex].label}</div>
        </div>
      )}
    </div>
  );
});

AreaChart.displayName = 'AreaChart';
