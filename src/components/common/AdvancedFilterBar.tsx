import React from 'react';
import { Calendar, Filter, RotateCcw } from 'lucide-react';
import { usePrefs } from '../../i18n/PrefsContext';

export type AdvancedFilterOption = {
  value: string;
  label: string;
};

export type AdvancedFilterField = {
  key: string;
  label: string;
  options: AdvancedFilterOption[];
};

export type AdvancedFilterBarProps = {
  fields?: AdvancedFilterField[];
  filterValues: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  dateFrom?: string;
  dateTo?: string;
  onDateFromChange?: (value: string) => void;
  onDateToChange?: (value: string) => void;
  showDates?: boolean;
  onReset?: () => void;
  activeCount?: number;
  extra?: React.ReactNode;
};

/** Holst advanced filter strip — global color/font via CSS vars. */
export const AdvancedFilterBar: React.FC<AdvancedFilterBarProps> = ({
  fields = [],
  filterValues,
  onFilterChange,
  dateFrom = '',
  dateTo = '',
  onDateFromChange,
  onDateToChange,
  showDates = true,
  onReset,
  activeCount = 0,
  extra,
}) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';

  const selectStyle: React.CSSProperties = {
    background: 'var(--bg)',
    borderColor: 'var(--border)',
    color: 'var(--text)',
    fontFamily: 'var(--font-ui)',
    borderRadius: 'var(--radius-ctrl, 0.75rem)',
  };

  return (
    <div
      className="flex flex-wrap items-center gap-2 min-w-0"
      style={{ fontFamily: 'var(--font-ui)' }}
      role="group"
      aria-label={isAr ? 'فلاتر متقدمة' : 'Advanced filters'}
    >
      <span
        className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide shrink-0"
        style={{ color: 'var(--muted)' }}
      >
        <Filter className="w-3 h-3" style={{ color: 'var(--accent)' }} aria-hidden />
        {isAr ? 'فلاتر' : 'Filters'}
        {activeCount > 0 ? (
          <span
            className="ms-0.5 px-1.5 py-0.5 rounded-full tabular-nums"
            style={{
              background: 'color-mix(in srgb, var(--accent) 14%, transparent)',
              color: 'var(--accent)',
            }}
          >
            {activeCount}
          </span>
        ) : null}
      </span>

      {fields.map((field) => (
        <label key={field.key} className="inline-flex items-center gap-1.5 min-w-0">
          <span className="sr-only">{field.label}</span>
          <select
            value={filterValues[field.key] ?? 'all'}
            onChange={(e) => onFilterChange(field.key, e.target.value)}
            aria-label={field.label}
            className="px-2.5 py-1.5 text-[11px] font-semibold border focus:outline-none max-w-[11rem]"
            style={selectStyle}
          >
            {field.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      ))}

      {showDates && onDateFromChange && onDateToChange ? (
        <div className="inline-flex flex-wrap items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent)' }} aria-hidden />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            aria-label={isAr ? 'من تاريخ' : 'From date'}
            className="px-2 py-1.5 text-[11px] border focus:outline-none"
            style={selectStyle}
          />
          <span className="text-[10px]" style={{ color: 'var(--muted)' }}>
            {isAr ? 'إلى' : 'to'}
          </span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            aria-label={isAr ? 'إلى تاريخ' : 'To date'}
            className="px-2 py-1.5 text-[11px] border focus:outline-none"
            style={selectStyle}
          />
        </div>
      ) : null}

      {extra}

      {onReset && activeCount > 0 ? (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold border transition-colors"
          style={{
            ...selectStyle,
            color: 'var(--accent)',
          }}
        >
          <RotateCcw className="w-3 h-3" aria-hidden />
          {isAr ? 'إعادة ضبط' : 'Reset'}
        </button>
      ) : null}
    </div>
  );
};
