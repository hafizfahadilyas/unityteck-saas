/**
 * @file useDateRange.ts
 * Re-export of universal date range hook for notification-system modules.
 */

export { useDateRange, calculateDateRange } from '../../context/DateRangeContext';
export type {
  UniversalDatePreset,
  DateGranularity,
  DateRangeBoundaries,
  DateRangeContextValue,
} from '../../context/DateRangeContext';
