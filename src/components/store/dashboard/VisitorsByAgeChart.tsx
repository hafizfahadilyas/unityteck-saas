import React, { useMemo } from 'react';
import { Users } from 'lucide-react';
import { usePrefs } from '../../../i18n/PrefsContext';

export interface AgePoint {
  label: string;
  percentage: number;
}

interface VisitorsByAgeChartProps {
  data?: AgePoint[];
}

export const VisitorsByAgeChart: React.FC<VisitorsByAgeChartProps> = React.memo(({ data = [] }) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';

  const points = data;

  const maxY = useMemo(() => {
    if (!points || points.length === 0) return 25;
    const maxVal = Math.max(...points.map((p) => p.percentage), 10);
    return Math.ceil(maxVal / 5) * 5 || 25;
  }, [points]);

  const yTicks = useMemo(() => {
    const step = maxY / 5;
    return [maxY, Math.round(step * 4), Math.round(step * 3), Math.round(step * 2), Math.round(step), 0];
  }, [maxY]);

  const chartHeight = 150;
  const chartWidth = 460;
  const barWidth = 26;

  return (
    <div className="p-4 sm:p-5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
      {/* ── Card Header ── */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 flex items-center justify-center border border-teal-200/60 dark:border-teal-800/40">
          <Users className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
            {isAr ? 'الزوار حسب الفئة العمرية' : 'Visitors by Age'}
          </h3>
          <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
            {isAr ? 'من أي فئات عمرية يأتي زوار متجرك؟' : 'Which age groups are your visitors from?'}
          </p>
        </div>
      </div>

      {/* ── Responsive Bar Chart or Clean Empty State ── */}
      {points.length === 0 ? (
        <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-[#006d77] dark:text-teal-300 flex items-center justify-center border border-teal-200/50 dark:border-teal-800/40 mb-2.5">
            <Users className="w-5 h-5 text-slate-400 dark:text-slate-500" />
          </div>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {isAr ? 'لا توجد بيانات ديموغرافية بعد' : 'No demographic data available'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[240px]">
            {isAr ? 'ستتوفر إحصائيات الأعمار عند ربط Google Analytics أو تسجيل العملاء' : 'Demographic insights will appear when customers register with birthday or Google Analytics is connected'}
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
              const y = chartHeight - (tick / maxY) * chartHeight + 10;
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

            {/* Bars */}
            {points.map((pt, idx) => {
              const colWidth = (chartWidth - 55) / points.length;
              const x = 38 + idx * colWidth + (colWidth - barWidth) / 2;
              const barHeight = (pt.percentage / maxY) * chartHeight;
              const y = chartHeight - barHeight + 10;

              return (
                <g key={idx} className="cursor-pointer group">
                  {/* Top Percentage Label - crisp high-contrast */}
                  <text
                    x={x + barWidth / 2}
                    y={y - 6}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="800"
                    fill="currentColor"
                    className="text-teal-700 dark:text-teal-300 font-black"
                  >
                    {pt.percentage}%
                  </text>

                  {/* Gradient Bar */}
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={Math.max(2, barHeight)}
                    rx={4}
                    fill="url(#ageBarGradient)"
                    className="transition-all duration-150 group-hover:brightness-105"
                  />

                  {/* Bottom Age Label */}
                  <text
                    x={x + barWidth / 2}
                    y={chartHeight + 25}
                    textAnchor="middle"
                    fontSize="10.5"
                    fontWeight="700"
                    fill="currentColor"
                    className="text-slate-800 dark:text-slate-200 font-bold"
                  >
                    {pt.label}
                  </text>
                </g>
              );
            })}

            {/* Teal Gradient Definition */}
            <defs>
              <linearGradient id="ageBarGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#48cae4" />
                <stop offset="100%" stopColor="#0077b6" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      )}
    </div>
  );
});

VisitorsByAgeChart.displayName = 'VisitorsByAgeChart';
