/**
 * @file DateRangeContext.tsx
 * Universal Date Range Context for the Souq Enterprise Dashboard.
 * Synchronizes date filtering across:
 * - Notifications list (Zone 2)
 * - Analytics metric cards (Revenue, Orders, Customers, Traffic growth)
 * - Charts (Store Analytics, Sales Trend, Cylinders)
 * - Reports section
 * - Unified Notification Center
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  startOfDay,
  endOfDay,
  subDays,
  startOfWeek,
  endOfWeek,
  subWeeks,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  subYears,
  format,
  isWithinInterval,
} from 'date-fns';

export type UniversalDatePreset =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'last_30_days'
  | 'last_90_days'
  | 'this_year'
  | 'last_year'
  | 'custom';

export type DateGranularity = 'hourly' | 'daily' | 'weekly' | 'monthly';

export interface DateRangeBoundaries {
  from: Date;
  to: Date;
  preset: UniversalDatePreset;
  granularity: DateGranularity;
  labelEn: string;
  labelAr: string;
  tooltipRange: string;
  isFiltered: boolean;
}

export interface DateRangeContextValue extends DateRangeBoundaries {
  setPreset: (preset: UniversalDatePreset) => void;
  setCustomRange: (from: Date, to: Date) => void;
  timezone: string;
  setTimezone: (tz: string) => void;
}

const STORAGE_KEY = 'souq_universal_date_range';

/**
 * Calculates start and end boundaries for any preset
 */
export function calculateDateRange(
  preset: UniversalDatePreset,
  customFrom?: Date | null,
  customTo?: Date | null,
  timezone = 'Asia/Riyadh',
): { from: Date; to: Date; granularity: DateGranularity; labelEn: string; labelAr: string } {
  const now = new Date();

  switch (preset) {
    case 'today': {
      const from = startOfDay(now);
      const to = now;
      return {
        from,
        to,
        granularity: 'hourly',
        labelEn: 'Today',
        labelAr: 'اليوم',
      };
    }
    case 'yesterday': {
      const yesterday = subDays(now, 1);
      const from = startOfDay(yesterday);
      const to = endOfDay(yesterday);
      return {
        from,
        to,
        granularity: 'hourly',
        labelEn: 'Yesterday',
        labelAr: 'أمس',
      };
    }
    case 'this_week': {
      // Saudi business week starts on Saturday (weekStartsOn: 6)
      const from = startOfWeek(now, { weekStartsOn: 6 });
      const to = now;
      return {
        from,
        to,
        granularity: 'daily',
        labelEn: 'This Week',
        labelAr: 'هذا الأسبوع',
      };
    }
    case 'last_week': {
      const prevWeekDate = subWeeks(now, 1);
      const from = startOfWeek(prevWeekDate, { weekStartsOn: 6 });
      const to = endOfWeek(prevWeekDate, { weekStartsOn: 6 });
      return {
        from,
        to,
        granularity: 'daily',
        labelEn: 'Last Week',
        labelAr: 'الأسبوع الماضي',
      };
    }
    case 'this_month': {
      const from = startOfMonth(now);
      const to = now;
      return {
        from,
        to,
        granularity: 'weekly',
        labelEn: 'This Month',
        labelAr: 'هذا الشهر',
      };
    }
    case 'last_month': {
      const prevMonthDate = subMonths(now, 1);
      const from = startOfMonth(prevMonthDate);
      const to = endOfMonth(prevMonthDate);
      return {
        from,
        to,
        granularity: 'weekly',
        labelEn: 'Last Month',
        labelAr: 'الشهر الماضي',
      };
    }
    case 'last_30_days': {
      const from = subDays(now, 30);
      const to = now;
      return {
        from,
        to,
        granularity: 'daily',
        labelEn: 'Last 30 Days',
        labelAr: 'آخر 30 يوماً',
      };
    }
    case 'last_90_days': {
      const from = subDays(now, 90);
      const to = now;
      return {
        from,
        to,
        granularity: 'weekly',
        labelEn: 'Last 90 Days',
        labelAr: 'آخر 90 يوماً',
      };
    }
    case 'this_year': {
      const from = startOfYear(now);
      const to = now;
      return {
        from,
        to,
        granularity: 'monthly',
        labelEn: 'This Year',
        labelAr: 'هذا العام',
      };
    }
    case 'last_year': {
      const prevYear = subYears(now, 1);
      const from = startOfYear(prevYear);
      const to = endOfYear(prevYear);
      return {
        from,
        to,
        granularity: 'monthly',
        labelEn: 'Last Year',
        labelAr: 'العام الماضي',
      };
    }
    case 'custom': {
      const from = customFrom ? startOfDay(customFrom) : subDays(now, 7);
      const to = customTo ? endOfDay(customTo) : now;
      const diffDays = Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
      const granularity: DateGranularity =
        diffDays <= 2 ? 'hourly' : diffDays <= 31 ? 'daily' : diffDays <= 120 ? 'weekly' : 'monthly';
      const label = `${format(from, 'MMM d, yyyy')} - ${format(to, 'MMM d, yyyy')}`;
      return {
        from,
        to,
        granularity,
        labelEn: label,
        labelAr: label,
      };
    }
    default: {
      const from = startOfMonth(now);
      const to = now;
      return {
        from,
        to,
        granularity: 'weekly',
        labelEn: 'This Month',
        labelAr: 'هذا الشهر',
      };
    }
  }
}

const DateRangeContext = createContext<DateRangeContextValue | undefined>(undefined);

export const DateRangeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Read initial from URL query param if present, or localStorage, fallback to 'today'
  const [preset, setPresetState] = useState<UniversalDatePreset>(() => {
    try {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const queryPreset = urlParams.get('dateRange') as UniversalDatePreset;
        if (queryPreset) return queryPreset;
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.preset) return parsed.preset;
        }
      }
    } catch {
      // Fallback
    }
    return 'today';
  });

  const [customRange, setCustomRangeState] = useState<{ from: Date | null; to: Date | null }>(() => {
    try {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const fromParam = urlParams.get('from');
        const toParam = urlParams.get('to');
        if (fromParam && toParam) {
          return { from: new Date(fromParam), to: new Date(toParam) };
        }
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.from && parsed.to) {
            return { from: new Date(parsed.from), to: new Date(parsed.to) };
          }
        }
      }
    } catch {}
    return { from: null, to: null };
  });

  const [timezone, setTimezone] = useState<string>('Asia/Riyadh');

  // Compute calculated range
  const computed = useMemo(() => {
    const res = calculateDateRange(preset, customRange.from, customRange.to, timezone);
    const tooltip = `${format(res.from, 'PP pp')} → ${format(res.to, 'PP pp')}`;
    return {
      ...res,
      preset,
      tooltipRange: tooltip,
      isFiltered: preset !== 'today',
    };
  }, [preset, customRange, timezone]);

  // Sync state to localStorage & URL query params
  const setPreset = (nextPreset: UniversalDatePreset) => {
    setPresetState(nextPreset);
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          preset: nextPreset,
          from: customRange.from?.toISOString(),
          to: customRange.to?.toISOString(),
        }),
      );
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('dateRange', nextPreset);
        if (nextPreset !== 'custom') {
          url.searchParams.delete('from');
          url.searchParams.delete('to');
        }
        window.history.replaceState({}, '', url.toString());
      }
    } catch {}
  };

  const setCustomRange = (from: Date, to: Date) => {
    setPresetState('custom');
    setCustomRangeState({ from, to });
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          preset: 'custom',
          from: from.toISOString(),
          to: to.toISOString(),
        }),
      );
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('dateRange', 'custom');
        url.searchParams.set('from', from.toISOString());
        url.searchParams.set('to', to.toISOString());
        window.history.replaceState({}, '', url.toString());
      }
    } catch {}
  };

  const value: DateRangeContextValue = {
    ...computed,
    setPreset,
    setCustomRange,
    timezone,
    setTimezone,
  };

  return <DateRangeContext.Provider value={value}>{children}</DateRangeContext.Provider>;
};

/**
 * Hook to access universal date range state across any dashboard component
 */
export function useDateRange(): DateRangeContextValue {
  const context = useContext(DateRangeContext);
  if (!context) {
    // Provide safe standalone fallback if used outside Provider
    const fallback = calculateDateRange('today');
    return {
      ...fallback,
      preset: 'today',
      tooltipRange: `${format(fallback.from, 'PP')} - ${format(fallback.to, 'PP')}`,
      isFiltered: false,
      setPreset: () => {},
      setCustomRange: () => {},
      timezone: 'Asia/Riyadh',
      setTimezone: () => {},
    };
  }
  return context;
}
