import React, { useRef } from 'react';
import { Calendar } from 'lucide-react';

type DateCalendarFieldProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  isAr?: boolean;
  id?: string;
  name?: string;
  min?: string;
  max?: string;
  className?: string;
  /** When false, hide the leading calendar icon (default true). */
  showIcon?: boolean;
};

/**
 * Native date input that always opens the calendar picker on click / icon tap.
 */
export const DateCalendarField: React.FC<DateCalendarFieldProps> = ({
  value,
  onChange,
  disabled,
  required,
  isAr = false,
  id,
  name,
  min,
  max,
  className = 'w-full py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white disabled:opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
  showIcon = true,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const openCalendar = () => {
    const el = inputRef.current;
    if (!el || disabled) return;
    try {
      // Chromium / modern browsers
      (el as HTMLInputElement & { showPicker?: () => void }).showPicker?.();
    } catch {
      el.focus();
    }
  };

  return (
    <div className="relative w-full min-w-0 max-w-full overflow-hidden">
      {showIcon ? (
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={openCalendar}
          className={`absolute top-1/2 -translate-y-1/2 z-[1] p-0.5 text-slate-400 hover:text-[var(--accent)] disabled:opacity-50 ${
            isAr ? 'right-2.5' : 'left-2.5'
          }`}
          aria-label={isAr ? 'فتح التقويم' : 'Open calendar'}
        >
          <Calendar className="w-3.5 h-3.5" />
        </button>
      ) : null}
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="date"
        disabled={disabled}
        required={required}
        value={value}
        min={min}
        max={max || new Date().toISOString().slice(0, 10)}
        onChange={(e) => onChange(e.target.value)}
        onClick={openCalendar}
        className={`${className} min-h-[2.25rem] max-w-full ${
          showIcon ? (isAr ? 'pr-9 pl-3' : 'pl-9 pr-3') : 'px-3'
        }`.trim()}
      />
    </div>
  );
};
