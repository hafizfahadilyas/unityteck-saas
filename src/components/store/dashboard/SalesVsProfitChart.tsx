import React, { useCallback, useMemo, useRef, useState } from 'react';
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

const CHART_HEIGHT = 150;
const CHART_WIDTH = 460;
const CHART_PAD_LEFT = 40;
const CHART_INNER = CHART_WIDTH - 55;

type BarLayout = {
  idx: number;
  date: string;
  sales: number;
  profit: number;
  isLabelPoint: boolean;
  groupX: number;
  salesY: number;
  profitY: number;
  salesH: number;
  profitH: number;
  barCenterX: number;
  salesHighlighted: boolean;
};

/**
 * Sales vs Estimated Profit — same visual language as Visits by Day
 * (rounded gradient bars, %/value labels on top, dotted grid).
 */
export const SalesVsProfitChart: React.FC<SalesVsProfitChartProps> = React.memo(({
  data = [],
}) => {
  const { locale, money } = usePrefs();
  const isAr = locale === 'ar';
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const hoverRef = useRef<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const gradId = React.useId().replace(/:/g, '');

  const points = data;
  const barWidth = points.length > 10 ? 8 : points.length > 6 ? 11 : 14;
  const barGap = 3;

  const maxVal = useMemo(() => {
    if (!points.length) return 100;
    let maxNumber = 10;
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const m = p.sales > p.profit ? p.sales : p.profit;
      if (m > maxNumber) maxNumber = m;
    }
    return Math.ceil(maxNumber / 50) * 50 || 100;
  }, [points]);

  const yTicks = useMemo(() => {
    const step = maxVal / 4;
    return [maxVal, Math.round(step * 3), Math.round(step * 2), Math.round(step), 0];
  }, [maxVal]);

  const peakSales = useMemo(() => {
    if (!points.length) return 0;
    return Math.max(...points.map((p) => p.sales));
  }, [points]);

  const layouts = useMemo<BarLayout[]>(() => {
    if (!points.length) return [];
    const rawGroup = CHART_INNER / points.length;
    const groupWidth =
      points.length <= 4 ? Math.min(rawGroup, 72) : rawGroup;
    const usedInner = groupWidth * points.length;
    const offsetX = CHART_PAD_LEFT + Math.max(0, (CHART_INNER - usedInner) / 2);
    return points.map((pt, idx) => {
      const groupX = offsetX + idx * groupWidth;
      const salesH = (pt.sales / maxVal) * CHART_HEIGHT;
      const profitH = (pt.profit / maxVal) * CHART_HEIGHT;
      return {
        idx,
        date: pt.date,
        sales: pt.sales,
        profit: pt.profit,
        isLabelPoint: !!pt.isLabelPoint,
        groupX,
        salesY: CHART_HEIGHT - salesH + 10,
        profitY: CHART_HEIGHT - profitH + 10,
        salesH,
        profitH,
        barCenterX: groupX + barWidth + barGap / 2,
        salesHighlighted: peakSales > 0 && pt.sales === peakSales,
      };
    });
  }, [points, maxVal, barWidth, barGap, peakSales]);

  const groupWidth = useMemo(() => {
    if (!points.length) return 0;
    const raw = CHART_INNER / points.length;
    return points.length <= 4 ? Math.min(raw, 72) : raw;
  }, [points.length]);

  const chartOffsetX = useMemo(() => {
    if (!points.length) return CHART_PAD_LEFT;
    const usedInner = groupWidth * points.length;
    return CHART_PAD_LEFT + Math.max(0, (CHART_INNER - usedInner) / 2);
  }, [points.length, groupWidth]);

  const setHoverFast = useCallback((idx: number | null) => {
    if (hoverRef.current === idx) return;
    hoverRef.current = idx;
    setHoveredIndex(idx);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg || !layouts.length || groupWidth <= 0) return;
      const rect = svg.getBoundingClientRect();
      if (rect.width <= 0) return;
      const x = ((e.clientX - rect.left) / rect.width) * CHART_WIDTH;
      const idx = Math.floor((x - chartOffsetX) / groupWidth);
      if (idx < 0 || idx >= layouts.length) {
        setHoverFast(null);
        return;
      }
      setHoverFast(idx);
    },
    [layouts.length, groupWidth, chartOffsetX, setHoverFast],
  );

  const tooltipInfo = useMemo(() => {
    if (hoveredIndex === null) return null;
    const layout = layouts[hoveredIndex];
    if (!layout) return null;
    const leftPercent = (layout.barCenterX / CHART_WIDTH) * 100;
    const topBarY = CHART_HEIGHT - Math.max(layout.salesH, layout.profitH) + 10;
    const topPercent = (topBarY / (CHART_HEIGHT + 35)) * 100;
    return {
      leftPercent,
      topPercent,
      placeBelow: topPercent < 30,
      date: layout.date,
      sales: layout.sales,
      profit: layout.profit,
    };
  }, [hoveredIndex, layouts]);

  const salesGrad = `salesPeakGrad-${gradId}`;
  const salesNormGrad = `salesNormGrad-${gradId}`;
  const profitGrad = `profitGrad-${gradId}`;

  return (
    <div
      className="u-card p-4 sm:p-5 rounded-[1.25rem] shadow-xs flex flex-col justify-between h-full min-h-[260px]"
      style={{ fontFamily: 'var(--font-ui)' }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="u-icon-brand w-8 h-8 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <div>
            <h3 className="text-sm font-black leading-tight" style={{ color: 'var(--text)' }}>
              {isAr ? 'المبيعات مقابل الأرباح التقديرية' : 'Sales vs Estimated Profit'}
            </h3>
            <p className="text-[11px] font-bold" style={{ color: 'var(--muted)' }}>
              {isAr
                ? 'كيف تتوزع المبيعات والأرباح التقديرية؟'
                : 'How do sales and estimated profit compare?'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-bold">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: 'linear-gradient(180deg, #7b2cbf, #9d4edd)' }}
            />
            <span className="font-bold" style={{ color: 'var(--text)' }}>
              {isAr ? 'المبيعات' : 'Sales'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: 'linear-gradient(180deg, #48cae4, #a0c4ff)' }}
            />
            <span className="font-bold" style={{ color: 'var(--text)' }}>
              {isAr ? 'الأرباح التقديرية' : 'Estimated Profit'}
            </span>
          </div>
        </div>
      </div>

      {points.length === 0 ? (
        <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
          <div className="u-icon-brand w-10 h-10 rounded-2xl flex items-center justify-center mb-2.5">
            <TrendingUp className="w-5 h-5 opacity-60" strokeWidth={1.75} />
          </div>
          <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
            {isAr ? 'لا توجد بيانات مبيعات في هذه الفترة' : 'No sales data for this period'}
          </p>
          <p className="text-xs mt-1 max-w-[240px]" style={{ color: 'var(--muted)' }}>
            {isAr
              ? 'ستظهر الرسوم البيانية فور استلام أول طلب في المتجر'
              : 'Charts will populate once orders are received'}
          </p>
        </div>
      ) : (
        <div className="relative w-full overflow-hidden pt-1">
          {tooltipInfo && (
            <div
              dir={isAr ? 'rtl' : 'ltr'}
              className="absolute pointer-events-none z-30"
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
              <div className="bg-slate-950/95 text-white p-3 rounded-2xl shadow-2xl border border-slate-700/80 w-max min-w-[170px] max-w-[min(260px,70vw)]">
                <div className="text-[11px] font-bold text-slate-300 pb-2 mb-2 border-b border-slate-700/70 flex items-center justify-between gap-3">
                  <span>{isAr ? 'التاريخ' : 'Date'}</span>
                  <span className="font-mono text-white text-[11px] font-extrabold dir-ltr">
                    {tooltipInfo.date}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-xs mb-1.5">
                  <span className="font-bold text-slate-200">{isAr ? 'المبيعات' : 'Sales'}:</span>
                  <span className="font-black text-white tabular-nums">{money(tooltipInfo.sales)}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="font-bold text-slate-200">
                    {isAr ? 'الأرباح التقديرية' : 'Estimated Profit'}:
                  </span>
                  <span className="font-black text-white tabular-nums">{money(tooltipInfo.profit)}</span>
                </div>
              </div>
            </div>
          )}

          <svg
            ref={svgRef}
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT + 35}`}
            className="w-full h-auto overflow-visible touch-none block"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label={isAr ? 'المبيعات مقابل الأرباح التقديرية' : 'Sales vs Estimated Profit'}
            onPointerMove={onPointerMove}
            onPointerLeave={() => setHoverFast(null)}
          >
            <defs>
              <linearGradient id={salesGrad} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7b2cbf" />
                <stop offset="100%" stopColor="#9d4edd" />
              </linearGradient>
              <linearGradient id={salesNormGrad} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#48cae4" />
                <stop offset="100%" stopColor="#80ed99" />
              </linearGradient>
              <linearGradient id={profitGrad} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#90e0ef" />
                <stop offset="100%" stopColor="#a0c4ff" />
              </linearGradient>
            </defs>

            {yTicks.map((tick) => {
              const y = CHART_HEIGHT - (tick / maxVal) * CHART_HEIGHT + 10;
              return (
                <g key={tick} className="text-slate-700 dark:text-slate-300">
                  <text
                    x={isAr ? CHART_WIDTH - 8 : 26}
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
                    x2={CHART_WIDTH - 10}
                    y2={y}
                    stroke="currentColor"
                    strokeOpacity="0.2"
                    strokeDasharray="2 3"
                  />
                </g>
              );
            })}

            {layouts.map((layout) => {
              const isHovered = hoveredIndex === layout.idx;
              const labelY = Math.min(layout.salesY, layout.profitY) - 6;
              return (
                <g key={layout.idx} className="cursor-pointer group">
                  {/* Compact value above peak bar (Visits-by-Day style) */}
                  {(layout.sales > 0 || layout.profit > 0) && (
                    <text
                      x={layout.barCenterX}
                      y={Math.max(12, labelY)}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="800"
                      fill="currentColor"
                      className={
                        layout.salesHighlighted
                          ? 'text-purple-700 dark:text-purple-300'
                          : 'text-slate-900 dark:text-slate-100'
                      }
                    >
                      {layout.sales >= 1000
                        ? `${Math.round(layout.sales / 100) / 10}k`
                        : Math.round(layout.sales)}
                    </text>
                  )}

                  <rect
                    x={layout.groupX}
                    y={layout.salesY}
                    width={barWidth}
                    height={Math.max(2, layout.salesH)}
                    rx={5}
                    fill={
                      layout.salesHighlighted
                        ? `url(#${salesGrad})`
                        : `url(#${salesNormGrad})`
                    }
                    opacity={isHovered ? 1 : 0.95}
                    className="transition-all duration-150 group-hover:brightness-105"
                  />
                  <rect
                    x={layout.groupX + barWidth + barGap}
                    y={layout.profitY}
                    width={barWidth}
                    height={Math.max(2, layout.profitH)}
                    rx={5}
                    fill={`url(#${profitGrad})`}
                    opacity={layout.profit <= 0 ? 0.35 : isHovered ? 1 : 0.95}
                    className="transition-all duration-150 group-hover:brightness-105"
                  />
                  {layout.isLabelPoint && (
                    <text
                      x={layout.barCenterX}
                      y={CHART_HEIGHT + 25}
                      textAnchor="middle"
                      fontSize="10.5"
                      fontWeight={layout.salesHighlighted || isHovered ? 800 : 700}
                      fill="currentColor"
                      className={
                        layout.salesHighlighted
                          ? 'text-purple-700 dark:text-purple-300'
                          : 'text-slate-800 dark:text-slate-200'
                      }
                    >
                      {layout.date}
                    </text>
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
