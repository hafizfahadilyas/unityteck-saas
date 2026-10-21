import React from 'react';
import { Calendar, ShoppingCart, Users, TrendingUp, Package, ChevronRight, HelpCircle } from 'lucide-react';
import { usePrefs } from '../../../i18n/PrefsContext';

interface MonthlySummaryCardProps {
  monthName?: string;
  salesValue?: number | string;
  visitsValue?: number | string;
  profitValue?: number | string;
  ordersValue?: number | string;
  salesGrowth?: number;
  visitsGrowth?: number;
  profitGrowth?: number;
  ordersGrowth?: number;
  onViewReports: () => void;
}

export const MonthlySummaryCard: React.FC<MonthlySummaryCardProps> = React.memo(({
  monthName = '',
  salesValue = 0,
  visitsValue = 0,
  profitValue = 0,
  ordersValue = 0,
  salesGrowth = 0,
  visitsGrowth = 0,
  profitGrowth = 0,
  ordersGrowth = 0,
  onViewReports,
}) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';

  const items = [
    {
      id: 'sales',
      labelEn: 'Sales',
      labelAr: 'المبيعات',
      value: typeof salesValue === 'number' ? salesValue.toLocaleString() : salesValue,
      growth: salesGrowth,
      icon: ShoppingCart,
      tooltip: isAr ? 'إجمالي المبيعات المحققة' : 'Total sales achieved',
    },
    {
      id: 'visits',
      labelEn: 'Visits',
      labelAr: 'الزيارات',
      value: typeof visitsValue === 'number' ? visitsValue.toLocaleString() : visitsValue,
      growth: visitsGrowth,
      icon: Users,
      tooltip: isAr ? 'عدد الزيارات للمتجر' : 'Store visitor sessions',
    },
    {
      id: 'profit',
      labelEn: 'Estimated Profit',
      labelAr: 'الأرباح التقديرية',
      value: typeof profitValue === 'number' ? profitValue.toLocaleString() : profitValue,
      growth: profitGrowth,
      icon: TrendingUp,
      tooltip: isAr ? 'الأرباح التقديرية' : 'Estimated profit',
    },
    {
      id: 'orders',
      labelEn: 'Orders',
      labelAr: 'الطلبات',
      value: typeof ordersValue === 'number' ? ordersValue.toLocaleString() : ordersValue,
      growth: ordersGrowth,
      icon: Package,
      tooltip: isAr ? 'عدد الطلبات المكتملة' : 'Total completed orders',
    },
  ];

  return (
    <div className="p-3.5 sm:p-5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between w-full h-full min-w-0">
      {/* ── Card Header ── */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3 gap-2">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#e6f4f1] dark:bg-teal-950/60 text-[#006d77] dark:text-teal-300 flex items-center justify-center border border-teal-200/50 dark:border-teal-800/40 shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight truncate">
              {isAr ? 'ملخص شهري' : 'Monthly Summary'}
            </h3>
            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">
              {monthName}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onViewReports}
          className="text-xs font-bold text-[#006d77] hover:text-[#004d5a] dark:text-teal-300 flex items-center gap-1 hover:underline cursor-pointer shrink-0"
        >
          <span>{isAr ? 'عرض التقارير' : 'View Reports'}</span>
          <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
        </button>
      </div>

      {/* ── 2x2 Sub-Cards Grid (Fully responsive on Mobile, Tablet & Desktop) ── */}
      <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-2 sm:gap-2.5 xl:gap-3 pt-1">
        {items.map((item) => {
          const Icon = item.icon;
          const valStr = String(item.value);
          const isLargeNumber = valStr.length > 5;

          return (
            <div
              key={item.id}
              className="p-2.5 sm:p-3 xl:p-3.5 rounded-2xl bg-[#f8fafc] dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between group hover:border-teal-400/40 transition-colors min-w-0"
            >
              <div className="flex items-start gap-2 sm:gap-2.5 min-w-0">
                {/* Rounded Icon in soft teal circle */}
                <div className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full bg-[#e6f7f5] dark:bg-teal-950 text-[#007f8c] dark:text-teal-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2.2} />
                </div>

                <div className="min-w-0 flex-1">
                  <span
                    title={isAr ? item.labelAr : item.labelEn}
                    className="text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-200 block leading-snug break-words"
                  >
                    {isAr ? item.labelAr : item.labelEn}
                  </span>

                  {/* Fully visible price / count without any ellipsis cut-off */}
                  <div
                    title={valStr}
                    className={`font-black text-slate-950 dark:text-white tabular-nums tracking-tight mt-0.5 whitespace-nowrap ${
                      isLargeNumber
                        ? 'text-sm sm:text-[15px] xl:text-base 2xl:text-lg'
                        : 'text-base sm:text-lg xl:text-xl'
                    }`}
                  >
                    {item.value}
                  </div>
                </div>
              </div>

              {/* Bottom Row: Growth Badge / Dash on Start, Info HelpCircle on End */}
              <div className="mt-2.5 pt-1.5 flex items-center justify-between gap-1 text-[11px] font-bold">
                {item.growth !== 0 ? (
                  <div
                    className={`flex items-center gap-1 font-black ${
                      item.growth > 0
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : 'text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    <span>{item.growth > 0 ? '↑' : '↓'}</span>
                    <span>{Math.abs(item.growth)}%</span>
                  </div>
                ) : (
                  <div className="text-slate-500 dark:text-slate-400 font-bold">
                    <span>—</span>
                  </div>
                )}

                <div
                  title={item.tooltip}
                  aria-label={item.tooltip}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer shrink-0 p-0.5"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

MonthlySummaryCard.displayName = 'MonthlySummaryCard';
