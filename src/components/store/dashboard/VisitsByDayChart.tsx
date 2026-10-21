import React, { useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { usePrefs } from '../../../i18n/PrefsContext';

export interface DayVisitPoint {
  dayEn: string;
  dayAr: string;
  percentage: number;
  highlighted?: boolean;
}

interface VisitsByDayChartProps {
  data?: DayVisitPoint[];
}

export const VisitsByDayChart: React.FC<VisitsByDayChartProps> = React.memo(({ data = [] }) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';

  const points = data;

  const maxPct = useMemo(() => {
    if (!points || points.length === 0) return 20;
    const maxVal = Math.max(...points.map((p) => p.percentage), 10);
    return Math.ceil(maxVal / 5) * 5 || 20;
  }, [points]);

  const yTicks = useMemo(() => {
    const step = maxPct / 4;
    return [maxPct, Math.round(step * 3), Math.round(step * 2), Math.round(step), 0];
  }, [maxPct]);

  const chartHeight = 150;
  const chartWidth = 460;
  const barWidth = 32;

  return (
    <div className="p-4 sm:p-5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
      {/* ── Card Header ── */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 flex items-center justify-center border border-teal-200/60 dark:border-teal-800/40">
          <Calendar className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
            {isAr ? 'الزيارات حسب اليوم' : 'Visits by Day'}
          </h3>
          <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
            {isAr ? 'ما هي الأيام الأكثر زيارة في متجرك؟' : 'Which days do you get the most visits?'}
          </p>
        </div>
      </div>

      {/* ── Responsive Day Bar Chart or Clean Empty State ── */}
      {points.length === 0 ? (
        <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-[#006d77] dark:text-teal-300 flex items-center justify-center border border-teal-200/50 dark:border-teal-800/40 mb-2.5">
            <Calendar className="w-5 h-5 text-slate-400 dark:text-slate-500" />
          </div>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {isAr ? 'لا توجد بيانات زيارات يومية بعد' : 'No daily visit data yet'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[240px]">
            {isAr ? 'ستظهر هنا نسب الزيارات والطلبات لكل يوم من أيام الأسبوع' : 'Day-by-day distribution will appear as visits and orders come in'}
          </p>
        </div>
      ) : (
        <div className="relative w-full overflow-hidden pt-1">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight + 35}`}
            className="w-full h-auto overflow-visible"
          >
            {/* Y Axis Grid Lines & Ticks */}
            {yTicks.map((tick) => {
              const y = chartHeight - (tick / maxPct) * chartHeight + 10;
              return (
                <g key={tick} className="text-slate-700 dark:text-slate-300">
                  <text
                    x={isAr ? chartWidth - 8 : 26}
                    y={y + 3.5}
                    textAnchor={isAr ? 'start' : 'end'}
                    fontSize="10"
                    fontWeight="700"
                    fill="currentColor"
                  >
                    {tick}%
                  </text>
                  <line
                    x1={36}
                    y1={y}
                    x2={chartWidth - 10}
                    y2={y}
                    stroke="currentColor"
                    strokeOpacity="0.2"
                    strokeDasharray="2 3"
                  />
                </g>
              );
            })}

            {/* Day Bars */}
            {points.map((pt, idx) => {
              const colWidth = (chartWidth - 55) / points.length;
              const x = 40 + idx * colWidth + (colWidth - barWidth) / 2;
              const barHeight = (pt.percentage / maxPct) * chartHeight;
              const y = chartHeight - barHeight + 10;

              return (
                <g key={idx} className="cursor-pointer group">
                  {/* Percentage on top - crisp high-contrast in both Light & Dark modes */}
                  <text
                    x={x + barWidth / 2}
                    y={y - 6}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="800"
                    fill="currentColor"
                    className={
                      pt.highlighted
                        ? 'text-purple-700 dark:text-purple-300 font-black'
                        : 'text-slate-900 dark:text-slate-100 font-extrabold'
                    }
                  >
                    {pt.percentage}%
                  </text>

                  {/* Bar */}
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={Math.max(2, barHeight)}
                    rx={5}
                    fill={
                      pt.highlighted
                        ? 'url(#mondayHighlightGradient)'
                        : idx < 2
                        ? 'url(#weekendGradient)'
                        : 'url(#weekdayGradient)'
                    }
                    className="transition-all duration-150 group-hover:brightness-105"
                  />

                  {/* Day of Week Label - crisp & readable */}
                  <text
                    x={x + barWidth / 2}
                    y={chartHeight + 25}
                    textAnchor="middle"
                    fontSize="10.5"
                    fontWeight="700"
                    fill="currentColor"
                    className={
                      pt.highlighted
                        ? 'text-purple-700 dark:text-purple-300 font-black'
                        : 'text-slate-800 dark:text-slate-200 font-bold'
                    }
                  >
                    {isAr ? pt.dayAr : pt.dayEn}
                  </text>
                </g>
              );
            })}

            {/* Gradients */}
            <defs>
              {/* Weekend gradient (blue-teal) */}
              <linearGradient id="weekendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#90e0ef" />
                <stop offset="100%" stopColor="#a0c4ff" />
              </linearGradient>

              {/* Highlighted Day (Purple gradient) */}
              <linearGradient id="mondayHighlightGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7b2cbf" />
                <stop offset="100%" stopColor="#9d4edd" />
              </linearGradient>

              {/* Weekdays gradient (mint green) */}
              <linearGradient id="weekdayGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#48cae4" />
                <stop offset="100%" stopColor="#80ed99" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      )}
    </div>
  );
});

VisitsByDayChart.displayName = 'VisitsByDayChart';
