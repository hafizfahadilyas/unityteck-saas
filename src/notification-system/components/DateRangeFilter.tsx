/**
 * @file DateRangeFilter.tsx
 * Universal Date Range Filter with pill-style tabs, custom dual calendar popover,
 * quick presets (Last 7d, 14d, 30d, Quarter), max 2 years range, and timezone awareness.
 */

import React, { useRef, useState, useEffect } from 'react';
import {
  Calendar,
  ChevronDown,
  Check,
  RotateCcw,
  Sparkles,
  Clock,
  Globe,
} from 'lucide-react';
import { format, subDays, startOfQuarter, endOfQuarter, subYears } from 'date-fns';
import {
  useDateRange,
  UniversalDatePreset,
  DateRangeContextValue,
} from '../../context/DateRangeContext';
import { usePrefs } from '../../i18n/PrefsContext';

interface DateRangeFilterProps {
  value?: DateRangeContextValue;
  onChange?: (preset: UniversalDatePreset, customFrom?: Date, customTo?: Date) => void;
  className?: string;
  showAllPills?: boolean;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  value: propValue,
  onChange,
  className = '',
  showAllPills = false,
}) => {
  const contextValue = useDateRange();
  const dateRange = propValue || contextValue;

  const { locale } = usePrefs();
  const isAr = locale === 'ar';

  const [showCustomPopover, setShowCustomPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Custom picker state
  const [fromDateStr, setFromDateStr] = useState<string>(() =>
    format(dateRange.from, 'yyyy-MM-dd'),
  );
  const [toDateStr, setToDateStr] = useState<string>(() =>
    format(dateRange.to, 'yyyy-MM-dd'),
  );

  // Close on outside click
  useEffect(() => {
    if (!showCustomPopover) return;
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowCustomPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showCustomPopover]);

  const PILL_OPTIONS: { id: UniversalDatePreset; labelEn: string; labelAr: string; prominent?: boolean }[] = [
    { id: 'today', labelEn: 'Today', labelAr: 'اليوم', prominent: true },
    { id: 'yesterday', labelEn: 'Yesterday', labelAr: 'أمس', prominent: true },
    { id: 'this_week', labelEn: 'This Week', labelAr: 'هذا الأسبوع', prominent: true },
    { id: 'last_week', labelEn: 'Last Week', labelAr: 'الأسبوع الماضي' },
    { id: 'this_month', labelEn: 'This Month', labelAr: 'هذا الشهر', prominent: true },
    { id: 'last_month', labelEn: 'Last Month', labelAr: 'الشهر الماضي' },
    { id: 'last_30_days', labelEn: 'Last 30 Days', labelAr: 'آخر 30 يوم' },
    { id: 'last_90_days', labelEn: 'Last 90 Days', labelAr: 'آخر 90 يوم' },
    { id: 'this_year', labelEn: 'This Year', labelAr: 'هذا العام' },
    { id: 'last_year', labelEn: 'Last Year', labelAr: 'العام الماضي' },
    { id: 'custom', labelEn: 'Custom', labelAr: 'مخصص', prominent: true },
  ];

  // Prominent pills for compact views, full pills when showAllPills is true
  const visiblePills = showAllPills
    ? PILL_OPTIONS
    : PILL_OPTIONS.filter((p) => p.prominent || dateRange.preset === p.id);

  const handleSelectPreset = (preset: UniversalDatePreset) => {
    if (preset === 'custom') {
      setShowCustomPopover((v) => !v);
      return;
    }
    dateRange.setPreset(preset);
    if (onChange) onChange(preset);
    setShowCustomPopover(false);
  };

  const handleApplyCustom = () => {
    if (!fromDateStr || !toDateStr) return;
    const fromDate = new Date(`${fromDateStr}T00:00:00`);
    const toDate = new Date(`${toDateStr}T23:59:59`);
    dateRange.setCustomRange(fromDate, toDate);
    if (onChange) onChange('custom', fromDate, toDate);
    setShowCustomPopover(false);
  };

  const handleClearCustom = () => {
    dateRange.setPreset('today');
    if (onChange) onChange('today');
    setShowCustomPopover(false);
  };

  // Quick preset shortcuts inside popover
  const applyQuickPreset = (daysBack: number) => {
    const to = new Date();
    const from = subDays(to, daysBack);
    setFromDateStr(format(from, 'yyyy-MM-dd'));
    setToDateStr(format(to, 'yyyy-MM-dd'));
  };

  const applyQuarterPreset = () => {
    const to = endOfQuarter(new Date());
    const from = startOfQuarter(new Date());
    setFromDateStr(format(from, 'yyyy-MM-dd'));
    setToDateStr(format(to, 'yyyy-MM-dd'));
  };

  const minDateLimit = format(subYears(new Date(), 2), 'yyyy-MM-dd'); // 2 years back limit

  return (
    <div className={`relative inline-flex items-center gap-2 flex-wrap ${className}`}>
      {/* Pill tabs strip */}
      <div
        className="inline-flex items-center p-1 rounded-xl border shadow-2xs backdrop-blur-xs flex-wrap gap-0.5"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
        title={dateRange.tooltipRange}
      >
        {visiblePills.map((pill) => {
          const isActive = dateRange.preset === pill.id;
          return (
            <button
              key={pill.id}
              type="button"
              onClick={() => handleSelectPreset(pill.id)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer select-none whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>{isAr ? pill.labelAr : pill.labelEn}</span>
              {pill.id === 'custom' && (
                <ChevronDown
                  className={`w-3 h-3 ms-1 inline-block transition-transform ${
                    showCustomPopover ? 'rotate-180' : ''
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Custom Dual-Calendar Popover */}
      {showCustomPopover && (
        <div
          ref={popoverRef}
          className="absolute top-full end-0 mt-2 z-50 p-4 rounded-2xl shadow-2xl border w-[340px] sm:w-[420px] backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)',
            color: 'var(--text)',
          }}
        >
          {/* Popover Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2 font-bold text-xs">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>{isAr ? 'نطاق التاريخ المخصص' : 'Custom Date Range'}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
              <Globe className="w-3 h-3" />
              <span>{dateRange.timezone}</span>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="mb-3">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              {isAr ? 'فترات سريعة' : 'Quick Presets'}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => applyQuickPreset(7)}
                className="px-2 py-1 rounded-lg border text-[11px] font-medium hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-500 transition-colors"
                style={{ borderColor: 'var(--border)' }}
              >
                {isAr ? 'آخر 7 أيام' : 'Last 7 days'}
              </button>
              <button
                type="button"
                onClick={() => applyQuickPreset(14)}
                className="px-2 py-1 rounded-lg border text-[11px] font-medium hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-500 transition-colors"
                style={{ borderColor: 'var(--border)' }}
              >
                {isAr ? 'آخر 14 يوماً' : 'Last 14 days'}
              </button>
              <button
                type="button"
                onClick={() => applyQuickPreset(30)}
                className="px-2 py-1 rounded-lg border text-[11px] font-medium hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-500 transition-colors"
                style={{ borderColor: 'var(--border)' }}
              >
                {isAr ? 'آخر 30 يوماً' : 'Last 30 days'}
              </button>
              <button
                type="button"
                onClick={applyQuarterPreset}
                className="px-2 py-1 rounded-lg border text-[11px] font-medium hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-500 transition-colors"
                style={{ borderColor: 'var(--border)' }}
              >
                {isAr ? 'هذا الربع' : 'This Quarter'}
              </button>
            </div>
          </div>

          {/* Dual Calendar Inputs Side-by-Side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-4">
            <div>
              <label className="block text-[11px] font-semibold mb-1 opacity-80">
                {isAr ? 'من تاريخ (From):' : 'From Date:'}
              </label>
              <input
                type="date"
                min={minDateLimit}
                max={format(new Date(), 'yyyy-MM-dd')}
                value={fromDateStr}
                onChange={(e) => setFromDateStr(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border text-xs outline-none focus:border-emerald-500 transition-colors"
                style={{
                  background: 'var(--input-bg)',
                  borderColor: 'var(--border)',
                  color: 'var(--input-fg)',
                }}
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold mb-1 opacity-80">
                {isAr ? 'إلى تاريخ (To):' : 'To Date:'}
              </label>
              <input
                type="date"
                min={fromDateStr || minDateLimit}
                max={format(new Date(), 'yyyy-MM-dd')}
                value={toDateStr}
                onChange={(e) => setToDateStr(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border text-xs outline-none focus:border-emerald-500 transition-colors"
                style={{
                  background: 'var(--input-bg)',
                  borderColor: 'var(--border)',
                  color: 'var(--input-fg)',
                }}
              />
            </div>
          </div>

          {/* Granularity & Helper Info */}
          <div className="mb-4 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border text-[11px] flex items-center justify-between text-slate-500" style={{ borderColor: 'var(--border)' }}>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isAr ? 'التقسيم الزمني التلقائي:' : 'Auto Granularity:'}</span>
            </span>
            <span className="font-bold text-slate-700 dark:text-slate-300 capitalize">
              {dateRange.granularity}
            </span>
          </div>

          {/* Action Buttons: Apply + Clear */}
          <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
            <button
              type="button"
              onClick={handleClearCustom}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 text-slate-500 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isAr ? 'إعادة ضبط' : 'Clear'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCustomPopover(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleApplyCustom}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isAr ? 'تطبيق الفلتر' : 'Apply'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
