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

export const DonutChart: React.FC<DonutChartProps> = React.memo(({
  segments,
  centerLabel,
  centerValue,
  size = 180,
  strokeWidth = 22,
  showLegend = false,
}) => {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const total = segments.reduce((sum, seg) => sum + seg.value, 0);

  let accumulatedPercent = 0;

  return (
    <div className={`flex ${showLegend ? 'flex-col sm:flex-row items-center gap-6' : 'items-center justify-center'}`}>
      {/* SVG Ring */}
      <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90 overflow-visible">
          {/* Background Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-100 dark:text-slate-800 transition-colors"
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
                strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
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
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-3 select-none">
          <span className="text-sm sm:text-base font-black tracking-tight leading-tight text-slate-900 dark:text-white">
            {activeIdx !== null ? (segments[activeIdx].formattedValue || `${segments[activeIdx].value}%`) : centerValue}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-0.5 max-w-[90px] truncate">
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
                className={`flex items-center justify-between py-1 px-1.5 rounded-lg cursor-pointer transition-colors ${
                  isHovered ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
                onMouseEnter={() => setActiveIdx(idx)}
                onMouseLeave={() => setActiveIdx(null)}
              >
                <div className="flex items-center gap-2 truncate pe-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className={`truncate ${isHovered ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-600 dark:text-slate-400'}`}>
                    {seg.label}
                  </span>
                </div>
                <span className="font-semibold tabular-nums shrink-0 text-slate-900 dark:text-white">
                  {seg.formattedValue || `${seg.value}%`}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

DonutChart.displayName = 'DonutChart';
