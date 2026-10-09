import React from 'react';

interface ChannelBarItem {
  channel: string;
  rate: number; // e.g. 4.4
  benchmarkRate?: number; // e.g. 4.4 / 4.0
  color: string;
}

interface ChannelBarChartProps {
  items: ChannelBarItem[];
  maxRate?: number;
}

export const ChannelBarChart: React.FC<ChannelBarChartProps> = ({
  items,
  maxRate = 6.0,
}) => {
  return (
    <div className="w-full pt-4">
      {/* Y-axis grid & bars */}
      <div className="relative h-44 flex items-end justify-between gap-2 border-b border-slate-200 pb-1">
        {/* Y Axis guide ticks */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-slate-400 pointer-events-none -ml-4 pr-1">
          <span>6%</span>
          <span>4%</span>
          <span>2%</span>
          <span>0%</span>
        </div>

        {/* Horizontal gridlines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
          <div className="border-b border-dashed border-slate-200 w-full" />
          <div className="border-b border-dashed border-slate-200 w-full" />
          <div className="border-b border-dashed border-slate-200 w-full" />
          <div className="border-b border-slate-200 w-full" />
        </div>

        {/* Bars */}
        {items.map((item, idx) => {
          const heightPercent = Math.min(100, (item.rate / maxRate) * 100);

          return (
            <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group z-10">
              {/* Rate tooltip/pill */}
              <span className="text-[10px] font-bold text-slate-700 mb-1 group-hover:scale-110 transition-transform tabular-nums">
                {item.rate.toFixed(1)}%
              </span>

              {/* Bar Column */}
              <div
                className="w-full max-w-[28px] rounded-t-sm transition-all duration-300 relative group-hover:opacity-90 shadow-sm"
                style={{
                  height: `${heightPercent}%`,
                  backgroundColor: item.color,
                }}
              >
                {/* Secondary inner benchmark strip */}
                <div
                  className="absolute bottom-0 inset-x-0 bg-white/20"
                  style={{ height: '50%' }}
                />
              </div>

              {/* Channel Label */}
              <span className="text-[10px] font-medium text-slate-500 mt-2 truncate w-full text-center group-hover:text-slate-900 transition-colors">
                {item.channel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
