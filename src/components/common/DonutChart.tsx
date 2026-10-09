import React, { useState } from 'react';

export interface DonutSegment {
  label: string;
  value: number; // percentage or count
  color: string;
  formattedValue?: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  centerLabel: string;
  centerValue: string;
  size?: number;
  strokeWidth?: number;
  showLegend?: boolean;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  segments,
  centerLabel,
  centerValue,
  size = 180,
  strokeWidth = 24,
  showLegend = true,
}) => {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const total = segments.reduce((sum, seg) => sum + seg.value, 0);

  let accumulatedPercent = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      {/* SVG Ring */}
      <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="var(--border)"
            strokeWidth={strokeWidth}
            opacity={0.4}
          />
          {segments.map((seg, idx) => {
            const percent = total > 0 ? seg.value / total : 0;
            const strokeDasharray = `${percent * circumference} ${circumference}`;
            const strokeDashoffset = -accumulatedPercent * circumference;
            accumulatedPercent += percent;

            const isHovered = activeIdx === idx;

            return (
              <circle
                key={idx}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={seg.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setActiveIdx(idx)}
                onMouseLeave={() => setActiveIdx(null)}
              />
            );
          })}
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
          <span className="text-xl font-bold tracking-tight leading-tight" style={{ color: 'var(--text)' }}>
            {activeIdx !== null ? (segments[activeIdx].formattedValue || `${segments[activeIdx].value}%`) : centerValue}
          </span>
          <span className="text-[11px] font-medium uppercase tracking-wide mt-0.5" style={{ color: 'var(--muted)' }}>
            {activeIdx !== null ? segments[activeIdx].label : centerLabel}
          </span>
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="grid grid-cols-2 sm:grid-cols-1 gap-x-4 gap-y-1.5 text-xs w-full">
          {segments.map((seg, idx) => {
            const isHovered = activeIdx === idx;
            return (
              <div
                key={idx}
                className="flex items-center justify-between py-1 px-1.5 rounded-lg cursor-pointer transition-colors"
                style={{
                  background: isHovered ? 'var(--hover-bg)' : 'transparent',
                }}
                onMouseEnter={() => setActiveIdx(idx)}
                onMouseLeave={() => setActiveIdx(null)}
              >
                <div className="flex items-center gap-2 truncate pe-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="truncate" style={{ color: isHovered ? 'var(--text)' : 'var(--muted)' }}>{seg.label}</span>
                </div>
                <span className="font-semibold tabular-nums shrink-0" style={{ color: 'var(--text)' }}>
                  {seg.formattedValue || `${seg.value}%`}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
