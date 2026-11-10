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

  // Active tooltip positioning and data
  const tooltipInfo = useMemo(() => {
    if (hoveredIndex === null || !points[hoveredIndex]) return null;
    const pt = points[hoveredIndex];
    const groupWidth = (chartWidth - 55) / points.length;
    const groupX = 38 + hoveredIndex * groupWidth;
    const barCenterX = groupX + barWidth + (barGap / 2);
    const leftPercent = (barCenterX / chartWidth) * 100;

    const salesHeight = (pt.sales / maxVal) * chartHeight;
    const profitHeight = (pt.profit / maxVal) * chartHeight;
    const topBarY = chartHeight - Math.max(salesHeight, profitHeight) + 10;
    const topPercent = (topBarY / (chartHeight + 35)) * 100;

    // Flip below bar if too close to top edge to prevent cut-off
    const placeBelow = topPercent < 30;

    return {
      leftPercent,
      topPercent,
      placeBelow,
      pt,
    };
  }, [hoveredIndex, points, chartWidth, chartHeight, maxVal, barWidth, barGap]);

  return (
    <div
      className="u-card p-4 sm:p-5 rounded-2xl shadow-xs flex flex-col justify-between h-full min-h-[280px]"
      style={{ fontFamily: 'var(--font-ui)' }}
    >
      {/* ── Card Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="u-icon-brand w-8 h-8 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-black" style={{ color: 'var(--text)' }}>
            {isAr ? 'المبيعات مقابل الأرباح التقديرية' : 'Sales vs Estimated Profit'}
          </h3>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-bold">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--accent)' }} />
            <span className="font-bold" style={{ color: 'var(--text)' }}>
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
          <div className="u-icon-brand w-10 h-10 rounded-2xl flex items-center justify-center mb-2.5">
            <TrendingUp className="w-5 h-5 opacity-60" />
          </div>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {isAr ? 'لا توجد بيانات مبيعات في هذه الفترة' : 'No sales data for this period'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[240px]">
            {isAr ? 'ستظهر الرسوم البيانية فور استلام أول طلب في المتجر' : 'Charts will populate once orders are received'}
          </p>
        </div>
      ) : (
        <div className="relative w-full pt-2">
          {/* ── High-Contrast, Fully Responsive Floating Tooltip (Bilingual Isolated) ── */}
          {tooltipInfo && (
            <div
              dir={isAr ? 'rtl' : 'ltr'}
              className="absolute pointer-events-none z-30 transition-all duration-150 ease-out"
              style={{
                left: `${tooltipInfo.leftPercent}%`,
                top: `${tooltipInfo.topPercent}%`,
                transform: `translate(${
                  tooltipInfo.leftPercent < 22
                    ? '0%'
                    : tooltipInfo.leftPercent > 78
                    ? '-100%'
                    : '-50%'
                }, ${tooltipInfo.placeBelow ? '14px' : '-100%'})`,
                marginTop: tooltipInfo.placeBelow ? '0px' : '-10px',
              }}
            >
              <div className="bg-slate-950/95 text-white p-3 rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-md w-max min-w-[170px] max-w-[260px]">
                {/* Header / Date */}
                <div className="text-[11px] font-bold text-slate-300 pb-2 mb-2 border-b border-slate-700/70 flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
                    {isAr ? 'التاريخ' : 'Date'}
                  </span>
                  <span className="font-mono text-white text-[11px] font-extrabold dir-ltr">
                    {tooltipInfo.pt.date}
                  </span>
                </div>

                {/* Sales Row */}
                <div className="flex items-center justify-between gap-3 text-xs mb-1.5">
                  <div className="flex items-center gap-1.5 font-medium text-slate-200">
                    <span className="w-2.5 h-2.5 rounded-md shrink-0 shadow-xs" style={{ background: 'var(--accent)' }} />
                    <span className="font-bold">{isAr ? 'المبيعات' : 'Sales'}:</span>
                  </div>
                  <span className="font-black text-white tabular-nums text-xs">
                    {money(tooltipInfo.pt.sales)}
                  </span>
                </div>

                {/* Profit Row */}
                <div className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-1.5 font-medium text-sky-300">
                    <span className="w-2.5 h-2.5 rounded-md bg-sky-400 shrink-0 shadow-xs shadow-sky-400/50" />
                    <span className="font-bold">{isAr ? 'الأرباح التقديرية' : 'Estimated Profit'}:</span>
                  </div>
                  <span className="font-black text-sky-300 tabular-nums text-xs">
                    {money(tooltipInfo.pt.profit)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight + 35}`}
            className="w-full h-auto overflow-visible"
            onMouseLeave={() => setHoveredIndex(null)}
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
                  className="cursor-pointer"
                >
                  {/* Subtle column highlight on hover */}
                  {isHovered && (
                    <rect
                      x={groupX - 3}
                      y={8}
                      width={barWidth * 2 + barGap + 6}
                      height={chartHeight + 4}
                      rx={6}
                      className="pointer-events-none"
                      fill="var(--accent)"
                      fillOpacity={0.12}
                    />
                  )}

                  {/* Sales Bar — brand accent */}
                  <rect
                    x={groupX}
                    y={salesY}
                    width={barWidth}
                    height={Math.max(2, salesHeight)}
                    rx={2.5}
                    className="transition-all duration-150"
                    fill="var(--accent)"
                    opacity={isHovered ? 1 : 0.92}
                  />

                  {/* Profit Bar (Sky Cyan) */}
                  <rect
                    x={groupX + barWidth + barGap}
                    y={profitY}
                    width={barWidth}
                    height={Math.max(2, profitHeight)}
                    rx={2.5}
                    className={`transition-all duration-150 ${
                      isHovered
                        ? 'fill-sky-400 dark:fill-sky-300 brightness-110'
                        : 'fill-sky-500 dark:fill-sky-400'
                    }`}
                  />

                  {/* X Axis Label */}
                  {pt.isLabelPoint && (
                    <text
                      x={groupX + barWidth + barGap / 2}
                      y={chartHeight + 25}
                      textAnchor="middle"
                      fontSize="10.5"
                      fontWeight="700"
                      fill="currentColor"
                      className={isHovered ? 'font-black' : 'font-bold'}
                      style={{ fill: isHovered ? 'var(--accent)' : 'var(--text)' }}
                    >
                      {pt.date}
                    </text>
                  )}

                  {/* Full-height invisible hover catchment hit area */}
                  <rect
                    x={groupX - 3}
                    y={0}
                    width={groupWidth}
                    height={chartHeight + 35}
                    fill="transparent"
                    className="cursor-pointer"
                    onClick={() => setHoveredIndex(hoveredIndex === idx ? null : idx)}
                  />
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
