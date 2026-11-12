import React, { useState } from 'react';
import { usePrefs } from '../../i18n/PrefsContext';

/** Translate the English month abbreviation in a date label to Arabic. */
const AR_MONTHS: Record<string, string> = {
  Jan: 'يناير', Feb: 'فبراير', Mar: 'مارس', Apr: 'أبريل', May: 'مايو', Jun: 'يونيو',
  Jul: 'يوليو', Aug: 'أغسطس', Sep: 'سبتمبر', Oct: 'أكتوبر', Nov: 'نوفمبر', Dec: 'ديسمبر',
};
const localizeDate = (label: string, isAr: boolean) => {
  if (!isAr) return label;
  const m = label.match(/^([A-Za-z]{3})\s+(\d+)(?:,\s*(\d{4}))?$/);
  if (!m) return label;
  const month = AR_MONTHS[m[1]] || m[1];
  return m[3] ? `${m[2]} ${month} ${m[3]}` : `${m[2]} ${month}`;
};

export interface VisitsOrdersPoint {
  date: string;
  shortDate: string;
  visits: number;
  orders: number;
}

interface VisitsOrdersChartProps {
  /** Real series from dashboard analytics API — never invent visits. */
  data?: VisitsOrdersPoint[];
}

export const VisitsOrdersChart: React.FC<VisitsOrdersChartProps> = ({ data: dataProp }) => {
  const data = dataProp && dataProp.length > 0 ? dataProp : [];
  const [activeIdx, setActiveIdx] = useState<number>(Math.max(0, data.length - 1));
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const visitsLabel = isAr ? 'الزيارات' : 'Visits';
  const ordersLabel = isAr ? 'الطلبات' : 'Orders';

  if (data.length === 0) {
    return (
      <div className="w-full h-[180px] flex items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-500 dark:text-slate-400">
        {isAr ? 'بانتظار بيانات الزيارات والطلبات' : 'Waiting for visits & orders data'}
      </div>
    );
  }

  const maxVisits = Math.max(...data.map((d) => d.visits), 1);
  const maxOrders = Math.max(...data.map((d) => d.orders), 1);
  const maxVal = Math.max(maxVisits, maxOrders * 8, 1);
  const width = 500;
  const height = 180;
  const padLeft = 40;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 30;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const getX = (idx: number) => padLeft + (idx / Math.max(data.length - 1, 1)) * chartW;
  const getY = (val: number) => padTop + chartH - (val / maxVal) * chartH;

  const visitsPoints = data.map((d, i) => `${getX(i)},${getY(d.visits)}`);
  const ordersPoints = data.map((d, i) => `${getX(i)},${getY(d.orders * 8)}`);

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

  const active = data[Math.min(activeIdx, data.length - 1)];

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[280px]">
        {data.map((d, i) => (
          <text
            key={`x-${i}`}
            x={getX(i)}
            y={height - 8}
            textAnchor="middle"
            className="fill-slate-500 text-[9px]"
          >
            {localizeDate(d.shortDate, isAr)}
          </text>
        ))}
        <path d={visitsD} fill="none" stroke="#0d9488" strokeWidth="2.5" />
        <path d={ordersD} fill="none" stroke="var(--accent)" strokeWidth="2.5" />
        {data.map((_, i) => (
          <circle
            key={`v-${i}`}
            cx={getX(i)}
            cy={getY(data[i].visits)}
            r={activeIdx === i ? 5 : 3}
            className="fill-teal-600 cursor-pointer"
            onMouseEnter={() => setActiveIdx(i)}
          />
        ))}
        {data.map((_, i) => (
          <circle
            key={`o-${i}`}
            cx={getX(i)}
            cy={getY(data[i].orders * 8)}
            r={activeIdx === i ? 5 : 3}
            className="fill-indigo-500 cursor-pointer"
            onMouseEnter={() => setActiveIdx(i)}
          />
        ))}
        {active && (
          <g>
            <rect
              x={Math.min(getX(activeIdx) - 70, width - 150)}
              y={8}
              width={140}
              height={36}
              rx={6}
              className="fill-white dark:fill-slate-900 stroke-slate-200 dark:stroke-slate-700"
            />
            <text
              x={Math.min(getX(activeIdx) - 62, width - 142)}
              y={22}
              className="fill-slate-700 dark:fill-slate-200 text-[9px] font-semibold"
            >
              {localizeDate(active.date, isAr)}
            </text>
            <text
              x={Math.min(getX(activeIdx) - 62, width - 142)}
              y={36}
              className="fill-teal-700 text-[9px]"
            >
              {visitsLabel}: {active.visits.toLocaleString()} · {ordersLabel}: {active.orders.toLocaleString()}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};
