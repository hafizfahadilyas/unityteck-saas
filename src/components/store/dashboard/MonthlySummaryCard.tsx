import React from 'react';
import { Calendar, ShoppingCart, Users, TrendingUp, Package, ChevronRight, HelpCircle } from 'lucide-react';
import { usePrefs } from '../../../i18n/PrefsContext';

interface MonthlySummaryCardProps {
  monthName?: string;
  salesValue?: number | string;
  visitsValue?: number | string;
  profitValue?: number | string;
  ordersValue?: number | string;
  salesGrowth?: number | null;
  visitsGrowth?: number | null;
  profitGrowth?: number | null;
  ordersGrowth?: number | null;
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
      tooltip: isAr
        ? 'جلسات زيارة حقيقية لهذا الشهر من متجرك فقط'
        : 'Real storefront sessions this calendar month only',
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
      tooltip: isAr ? 'طلبات هذا الشهر حسب النطاق المحدد' : 'Orders in the selected period (this month)',
    },
  ];

  return (
    <div
      className="u-card p-3.5 sm:p-5 rounded-2xl shadow-xs flex flex-col justify-between w-full h-full min-h-[280px] min-w-0"
      style={{ fontFamily: 'var(--font-ui)', color: 'var(--card-fg)' }}
    >
      {/* ── Card Header ── */}
      <div
        className="flex items-center justify-between pb-3 mb-3 gap-2"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="u-icon w-8 h-8 flex items-center justify-center border shrink-0" style={{ borderColor: 'var(--border)' }}>
            <Calendar className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-black leading-tight truncate" style={{ color: 'var(--text)' }}>
              {isAr ? 'ملخص شهري' : 'Monthly Summary'}
            </h3>
            <p className="text-[11px] font-bold truncate" style={{ color: 'var(--muted)' }}>
              {monthName}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onViewReports}
          className="text-xs font-bold flex items-center gap-1 hover:underline cursor-pointer shrink-0"
          style={{ color: 'var(--accent)' }}
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
              className="p-2.5 sm:p-3 xl:p-3.5 rounded-2xl flex flex-col justify-between group transition-colors min-w-0"
              style={{ background: 'var(--hover-bg)' }}
            >
              <div className="flex items-start gap-2 sm:gap-2.5 min-w-0">
                <div className="u-icon w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2.2} />
                </div>

                <div className="min-w-0 flex-1">
                  <span
                    title={isAr ? item.labelAr : item.labelEn}
                    className="text-[11px] sm:text-xs font-bold block leading-snug break-words"
                    style={{ color: 'var(--muted)' }}
                  >
                    {isAr ? item.labelAr : item.labelEn}
                  </span>

                  <div
                    title={valStr}
                    className={`font-black tabular-nums tracking-tight mt-0.5 whitespace-nowrap ${
                      isLargeNumber
                        ? 'text-sm sm:text-[15px] xl:text-base 2xl:text-lg'
                        : 'text-base sm:text-lg xl:text-xl'
                    }`}
                    style={{ color: 'var(--text)' }}
                  >
                    {item.value}
                  </div>
                </div>
              </div>

              <div className="mt-2.5 pt-1.5 flex items-center justify-between gap-1 text-[11px] font-bold">
                {item.growth != null && item.growth !== 0 ? (
                  <div
                    className="flex items-center gap-1 font-black"
                    style={{ color: item.growth > 0 ? 'var(--tone-success)' : 'var(--tone-danger)' }}
                  >
                    <span>{item.growth > 0 ? '↑' : '↓'}</span>
                    <span>{Math.abs(item.growth)}%</span>
                  </div>
                ) : (
                  <div className="font-bold" style={{ color: 'var(--muted)' }}>
                    <span>—</span>
                  </div>
                )}

                <div
                  title={item.tooltip}
                  aria-label={item.tooltip}
                  className="transition-colors cursor-pointer shrink-0 p-0.5"
                  style={{ color: 'var(--muted)' }}
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
