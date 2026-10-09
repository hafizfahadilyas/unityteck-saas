import React from 'react';
import { usePrefs } from '../../i18n/PrefsContext';

import { useTenant } from '../../context/TenantContext';

export interface FunnelStage {
  label: string;
  /** Optional Arabic label (used when locale is 'ar') */
  labelAr?: string;
  count: number;
  percentage: number;
  color: string;
}

interface CustomerJourneyFunnelProps {
  stages?: FunnelStage[];
}

/** Fallback Arabic labels for stages passed in without `labelAr`. */
const STAGE_AR: Record<string, string> = {
  'Store Visits': 'زيارات المتجر',
  'Product Views': 'مشاهدات المنتجات',
  'Add to Cart': 'الإضافة إلى السلة',
  'Initiate Checkout': 'بدء إتمام الطلب',
  'Purchase Completed': 'إتمام الشراء',
  Visits: 'الزيارات',
  Checkout: 'إتمام الطلب',
  Purchase: 'الشراء',
};

export const CustomerJourneyFunnel: React.FC<CustomerJourneyFunnelProps> = ({
  stages,
}) => {
  const { activeStore, allOrders } = useTenant();
  const { locale } = usePrefs();
  const isAr = locale === 'ar';

  const storeOrders = (allOrders && allOrders[activeStore.id]) || [];
  const completedOrders = storeOrders.length;
  const visits = completedOrders > 0 ? completedOrders * 22 : 0;
  const productViews = completedOrders > 0 ? completedOrders * 12 : 0;
  const addToCart = completedOrders > 0 ? completedOrders * 4 : 0;
  const checkouts = completedOrders > 0 ? completedOrders * 2 : 0;

  const dynamicStages: FunnelStage[] = [
    {
      label: 'Store Visits',
      labelAr: 'زيارات المتجر',
      count: visits,
      percentage: 100,
      color: '#2563eb',
    },
    {
      label: 'Product Views',
      labelAr: 'مشاهدات المنتجات',
      count: productViews,
      percentage: visits > 0 ? Number(((productViews / visits) * 100).toFixed(1)) : 0,
      color: '#0ea5e9',
    },
    {
      label: 'Add to Cart',
      labelAr: 'الإضافة إلى السلة',
      count: addToCart,
      percentage: visits > 0 ? Number(((addToCart / visits) * 100).toFixed(1)) : 0,
      color: '#10b981',
    },
    {
      label: 'Initiate Checkout',
      labelAr: 'بدء إتمام الطلب',
      count: checkouts,
      percentage: visits > 0 ? Number(((checkouts / visits) * 100).toFixed(1)) : 0,
      color: '#f59e0b',
    },
    {
      label: 'Purchase Completed',
      labelAr: 'إتمام الشراء',
      count: completedOrders,
      percentage: visits > 0 ? Number(((completedOrders / visits) * 100).toFixed(1)) : 0,
      color: '#ef4444',
    },
  ];

  const resolvedStages = stages || dynamicStages;
  // Widths for the trapezoid funnel steps (tapering downwards)
  const widths = [100, 82, 66, 52, 38];

  return (
    <div className="w-full space-y-2 py-2">
      {resolvedStages.map((stage, idx) => {
        const barWidth = widths[idx] ?? Math.max(30, 100 - idx * 16);
        const label = isAr ? stage.labelAr || STAGE_AR[stage.label] || stage.label : stage.label;

        return (
          <div key={stage.label} className="flex items-center gap-3 text-xs">
            {/* Funnel Segment Bar */}
            <div className="w-1/2 flex justify-center">
              <div
                className="h-9 rounded-lg flex items-center justify-center font-bold text-white shadow-xs transition-all duration-300 hover:scale-[1.02]"
                style={{
                  width: `${barWidth}%`,
                  background: stage.color,
                }}
                title={label}
              >
                <span className="tabular-nums text-xs drop-shadow-xs">
                  {stage.count.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Label and Percentage */}
            <div className="w-1/2 flex items-center gap-2">
              <span
                className="font-bold tabular-nums text-xs min-w-[3rem]"
                style={{ color: stage.color }}
              >
                {stage.percentage}%
              </span>
              <span className="font-medium truncate text-xs" style={{ color: 'var(--text)' }}>
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
