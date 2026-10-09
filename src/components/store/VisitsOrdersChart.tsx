import React, { useState } from 'react';
import { usePrefs } from '../../i18n/PrefsContext';

/** Translate the English month abbreviation in a mock date label to Arabic. */
const AR_MONTHS: Record<string, string> = {
  Jan: 'يناير', Feb: 'فبراير', Mar: 'مارس', Apr: 'أبريل', May: 'مايو', Jun: 'يونيو',
  Jul: 'يوليو', Aug: 'أغسطس', Sep: 'سبتمبر', Oct: 'أكتوبر', Nov: 'نوفمبر', Dec: 'ديسمبر',
};
const localizeDate = (label: string, isAr: boolean) => {
  if (!isAr) return label;
  // "Jan 1, 2024" -> "1 يناير 2024", "Jan 1" -> "1 يناير"
  const m = label.match(/^([A-Za-z]{3})\s+(\d+)(?:,\s*(\d{4}))?$/);
  if (!m) return label;
  const month = AR_MONTHS[m[1]] || m[1];
  return m[3] ? `${m[2]} ${month} ${m[3]}` : `${m[2]} ${month}`;
};

interface DataPoint {
  date: string;
  shortDate: string;
  visits: number;
  orders: number;
}

const DEFAULT_DATA: DataPoint[] = [
  { date: 'Jan 1, 2024', shortDate: 'Jan 1', visits: 18000, orders: 1200 },
  { date: 'Jan 5, 2024', shortDate: 'Jan 5', visits: 23500, orders: 1800 },
  { date: 'Jan 10, 2024', shortDate: 'Jan 10', visits: 22000, orders: 1650 },
  { date: 'Jan 15, 2024', shortDate: 'Jan 15', visits: 26500, orders: 2100 },
  { date: 'Jan 20, 2024', shortDate: 'Jan 20', visits: 32400, orders: 2850 },
  { date: 'Jan 25, 2024', shortDate: 'Jan 25', visits: 29000, orders: 2400 },
  { date: 'Jan 31, 2024', shortDate: 'Jan 31', visits: 31000, orders: 2600 },
];

export const VisitsOrdersChart: React.FC = () => {
  const [activeIdx, setActiveIdx] = useState<number>(4); // Default tooltip on Jan 20 (index 4)
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const visitsLabel = isAr ? 'الزيارات' : 'Visits';
  const ordersLabel = isAr ? 'الطلبات' : 'Orders';

  const data = DEFAULT_DATA;
  const maxVal = 40000;
  const width = 500;
  const height = 180;
  const padLeft = 40;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 30;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const getX = (idx: number) => padLeft + (idx / (data.length - 1)) * chartW;
  const getY = (val: number) => padTop + chartH - (val / maxVal) * chartH;

  // Build SVG path strings
  const visitsPoints = data.map((d, i) => `${getX(i)},${getY(d.visits)}`);
  const ordersPoints = data.map((d, i) => `${getX(i)},${getY(d.orders * 8)}`); // scaled for visual presence

  const visitsD = visitsPoints.reduce((acc, curr, i, arr) => {
    if (i === 0) return `M ${curr}`;
    const prev = arr[i - 1].split(',').map(Number);
    const c = curr.split(',').map(Number);
    const cp1x = prev[0] + (c[0] - prev[0]) / 2;
    const cp1y = prev[1];
    const cp2x = prev[0] + (c[0] - prev[0]) / 2;
    const cp2y = c[1];
    return `${acc} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${c[0]},${c[1]}`;
  }, '');

  const ordersD = ordersPoints.reduce((acc, curr, i, arr) => {
    if (i === 0) return `M ${curr}`;
    const prev = arr[i - 1].split(',').map(Number);
    const c = curr.split(',').map(Number);
    const cp1x = prev[0] + (c[0] - prev[0]) / 2;
    const cp1y = prev[1];
    const cp2x = prev[0] + (c[0] - prev[0]) / 2;
    const cp2y = c[1];
    return `${acc} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${c[0]},${c[1]}`;
  }, '');

  const yTicks = [0, 10000, 20000, 30000, 40000];
  const activePoint = data[activeIdx];

  return (
    <div className="w-full relative select-none">
      {/* Legend */}
      <div className="flex items-center justify-end gap-4 text-xs font-semibold mb-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#2563eb' }} />
          <span style={{ color: 'var(--text)' }}>{visitsLabel}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#10b981' }} />
          <span style={{ color: 'var(--text)' }}>{ordersLabel}</span>
        </div>
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible"
        >
          {/* Horizontal grid lines */}
          {yTicks.map((tick) => {
            const y = getY(tick);
            return (
              <g key={tick}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="var(--border)"
                  strokeDasharray="3 3"
                  strokeOpacity="0.6"
                />
                <text
                  x={padLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="9"
                  fill="var(--muted)"
                >
                  {tick === 0 ? '0' : `${tick / 1000}K`}
                </text>
              </g>
            );
          })}

          {/* Active indicator vertical line */}
          {activePoint ? (
            <line
              x1={getX(activeIdx)}
              y1={padTop}
              x2={getX(activeIdx)}
              y2={height - padBottom}
              stroke="#2563eb"
              strokeDasharray="2 2"
              strokeOpacity="0.4"
            />
          ) : null}

          {/* Visits Line */}
          <path
            d={visitsD}
            fill="none"
            stroke="#2563eb"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Orders Line */}
          <path
            d={ordersD}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Data Points */}
          {data.map((d, i) => (
            <g key={d.date} className="cursor-pointer" onClick={() => setActiveIdx(i)}>
              <circle
                cx={getX(i)}
                cy={getY(d.visits)}
                r={activeIdx === i ? 5 : 3.5}
                fill="#2563eb"
                stroke="var(--surface)"
                strokeWidth="1.5"
              />
              <circle
                cx={getX(i)}
                cy={getY(d.orders * 8)}
                r={activeIdx === i ? 5 : 3.5}
                fill="#10b981"
                stroke="var(--surface)"
                strokeWidth="1.5"
              />
            </g>
          ))}

          {/* X Axis labels */}
          {data.map((d, i) => (
            <text
              key={d.shortDate}
              x={getX(i)}
              y={height - padBottom + 16}
              textAnchor="middle"
              fontSize="9"
              fill="var(--muted)"
            >
              {localizeDate(d.shortDate, isAr)}
            </text>
          ))}
        </svg>

        {/* Floating Tooltip matching mockup */}
        {activePoint ? (
          <div
            className="absolute rounded-xl border p-2.5 shadow-xl text-xs pointer-events-none transition-all duration-200"
            style={{
              top: '10px',
              left: `${(getX(activeIdx) / width) * 100}%`,
              transform: 'translateX(-50%)',
              background: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
              minWidth: '120px',
              zIndex: 10,
            }}
          >
            <div className="font-bold text-[11px] mb-1.5 pb-1 border-b" style={{ borderColor: 'var(--border)' }}>
              {localizeDate(activePoint.date, isAr)}
            </div>
            <div className="flex items-center justify-between gap-3 text-[11px] mb-1">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full" style={{ background: '#2563eb' }} />
                {visitsLabel}
              </span>
              <span className="font-bold tabular-nums">{activePoint.visits.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full" style={{ background: '#10b981' }} />
                {ordersLabel}
              </span>
              <span className="font-bold tabular-nums">{activePoint.orders.toLocaleString()}</span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
