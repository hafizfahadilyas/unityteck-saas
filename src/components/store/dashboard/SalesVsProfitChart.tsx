import React, { useState, useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { usePrefs } from '../../../i18n/PrefsContext';

export interface DailySalesProfitPoint {
  date: string;
  sales: number;
  profit: number;
  isLabelPoint?: boolean;
}

interface SalesVsProfitChartProps {
  data?: DailySalesProfitPoint[];
  liveOrdersTotal?: number;
}

export const SalesVsProfitChart: React.FC<SalesVsProfitChartProps> = React.memo(({
  data = [],
  liveOrdersTotal = 0,
}) => {
  const { locale, money } = usePrefs();
  const isAr = locale === 'ar';
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const points = data;

  // Dynamically compute the Y-axis maximum from authentic points
  const maxVal = useMemo(() => {
    if (!points || points.length === 0) return 100;
    const maxNumber = Math.max(...points.map((p) => Math.max(p.sales, p.profit)), 10);
    return Math.ceil(maxNumber / 50) * 50 || 100;
  }, [points]);

  const yTicks = useMemo(() => {
    const step = maxVal / 4;
    return [maxVal, Math.round(step * 3), Math.round(step * 2), Math.round(step), 0];
  }, [maxVal]);

  const chartHeight = 175;
  const chartWidth = 460;
  const barWidth = points.length > 10 ? 8 : 12;
  const barGap = 2.5;

  return (
    <div className="p-4 sm:p-5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
      {/* ── Card Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#e6f4f1] dark:bg-teal-950/60 text-[#006d77] dark:text-teal-300 flex items-center justify-center border border-teal-200/50 dark:border-teal-800/40">
            <TrendingUp className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white">
            {isAr ? 'المبيعات مقابل الأرباح التقديرية' : 'Sales vs Estimated Profit'}
          </h3>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-bold">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-700 dark:bg-teal-400" />
            <span className="text-slate-900 dark:text-slate-100 font-bold">
              {isAr ? 'المبيعات' : 'Sales'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 dark:bg-sky-400" />
            <span className="text-slate-900 dark:text-slate-100 font-bold">
              {isAr ? 'الأرباح التقديرية' : 'Estimated Profit'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Responsive Grouped Bar Chart or Real Empty State ── */}
      {points.length === 0 ? (
        <div className="py-14 px-4 text-center flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-[#006d77] dark:text-teal-300 flex items-center justify-center border border-teal-200/50 dark:border-teal-800/40 mb-2.5">
            <TrendingUp className="w-5 h-5 text-slate-400 dark:text-slate-500" />
          </div>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {isAr ? 'لا توجد بيانات مبيعات في هذه الفترة' : 'No sales data for this period'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[240px]">
            {isAr ? 'ستظهر الرسوم البيانية فور استلام أول طلب في المتجر' : 'Charts will populate once orders are received'}
          </p>
        </div>
      ) : (
        <div className="relative w-full overflow-hidden pt-2">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight + 35}`}
            className="w-full h-auto overflow-visible"
          >
            {/* Y Axis Grid Lines & Labels */}
            {yTicks.map((tick) => {
              const y = chartHeight - (tick / maxVal) * chartHeight + 10;
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
                    {tick}
                  </text>
                  <line
                    x1={36}
                    y1={y}
                    x2={chartWidth - 10}
                    y2={y}
                    stroke="currentColor"
                    strokeOpacity="0.2"
                    strokeDasharray="3 3"
                  />
                </g>
              );
            })}

            {/* Grouped Bars */}
            {points.map((pt, idx) => {
              const groupWidth = (chartWidth - 55) / points.length;
              const groupX = 38 + idx * groupWidth;
              const salesHeight = (pt.sales / maxVal) * chartHeight;
              const profitHeight = (pt.profit / maxVal) * chartHeight;
              const salesY = chartHeight - salesHeight + 10;
              const profitY = chartHeight - profitHeight + 10;
              const isHovered = hoveredIndex === idx;

              return (
                <g
                  key={idx}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="cursor-pointer"
                >
                  {/* Sales Bar (Teal) */}
                  <rect
                    x={groupX}
                    y={salesY}
                    width={barWidth}
                    height={Math.max(2, salesHeight)}
                    rx={2.5}
                    className="fill-teal-700 dark:fill-teal-400 transition-all duration-150 hover:brightness-110"
                  />

                  {/* Profit Bar (Sky Cyan) */}
                  <rect
                    x={groupX + barWidth + barGap}
                    y={profitY}
                    width={barWidth}
                    height={Math.max(2, profitHeight)}
                    rx={2.5}
                    className="fill-sky-500 dark:fill-sky-400 transition-all duration-150 hover:brightness-110"
                  />

                  {/* X Axis Label */}
                  {pt.isLabelPoint && (
                    <text
                      x={groupX + barWidth}
                      y={chartHeight + 25}
                      textAnchor="middle"
                      fontSize="10.5"
                      fontWeight="700"
                      fill="currentColor"
                      className={isHovered ? 'text-teal-700 dark:text-teal-300 font-black' : 'text-slate-800 dark:text-slate-200 font-bold'}
                    >
                      {pt.date}
                    </text>
                  )}

                  {/* Tooltip */}
                  {isHovered && (
                    <g className="animate-in fade-in zoom-in-95 duration-100 pointer-events-none">
                      <rect
                        x={Math.min(chartWidth - 105, Math.max(10, groupX - 35))}
                        y={Math.max(2, Math.min(salesY, profitY) - 36)}
                        width={90}
                        height={30}
                        rx={6}
                        fill="#021c22"
                        opacity="0.95"
                      />
                      <text
                        x={Math.min(chartWidth - 60, Math.max(55, groupX + 10))}
                        y={Math.max(2, Math.min(salesY, profitY) - 23)}
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="bold"
                        fill="#ffffff"
                      >
                        {isAr ? 'المبيعات' : 'Sales'}: {money(pt.sales)}
                      </text>
                      <text
                        x={Math.min(chartWidth - 60, Math.max(55, groupX + 10))}
                        y={Math.max(2, Math.min(salesY, profitY) - 11)}
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="bold"
                        fill="#48cae4"
                      >
                        {isAr ? 'الأرباح' : 'Profit'}: {money(pt.profit)}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
});

SalesVsProfitChart.displayName = 'SalesVsProfitChart';
