import React, { useMemo, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { FloatingPopover } from './FloatingPopover';

export type PortalSelectOption = {
  value: string;
  label: string;
  icon?: React.ReactNode;
};

type PortalSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: PortalSelectOption[];
  disabled?: boolean;
  required?: boolean;
  className?: string;
  placeholder?: string;
  /** Always open under the trigger (scroll inside). Default true for modal forms. */
  preferBelow?: boolean;
  estimatedHeight?: number;
  align?: 'start' | 'end';
};

/**
 * Body-portal select — works inside GlobalModal (above modal z-index),
 * never clipped, and opens downward by default.
 */
export const PortalSelect: React.FC<PortalSelectProps> = ({
  value,
  onChange,
  options,
  disabled,
  required,
  className = 'w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] text-[var(--input-fg)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]',
  placeholder,
  preferBelow = true,
  estimatedHeight,
  align = 'start',
}) => {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  const selected = useMemo(
    () => options.find((o) => o.value === value),
    [options, value],
  );

  // Prefer full list height; FloatingPopover scrolls only if viewport is short.
  const resolvedEstimate = useMemo(() => {
    if (typeof estimatedHeight === 'number' && estimatedHeight > 0) return estimatedHeight;
    return Math.min(16 + options.length * 40, 560);
  }, [estimatedHeight, options.length]);

  const close = () => setOpen(false);

  return (
    <div className="w-full min-w-0">
      {required ? (
        <select
          tabIndex={-1}
          aria-hidden
          required
          value={value}
          onChange={() => undefined}
          className="sr-only"
        >
          <option value="">{placeholder || ''}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : null}

      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          if (disabled) return;
          setOpen((v) => !v);
        }}
        className={`${className} min-h-[2.25rem] flex items-center justify-between gap-2 text-start cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed`.trim()}
      >
        <span
          className="truncate flex items-center gap-2"
          style={{ color: selected ? 'var(--input-fg)' : 'var(--muted)' }}
        >
          {selected?.icon}
          {selected?.label || placeholder || '—'}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          style={{ color: 'var(--muted)' }}
        />
      </button>

      <FloatingPopover
        open={open && !disabled}
        anchorRef={triggerRef}
        onClose={close}
        width={Math.max(220, triggerRef.current?.offsetWidth || 260)}
        align={align}
        estimatedHeight={resolvedEstimate}
        preferBelow={preferBelow}
        className="rounded-xl shadow-xl p-1 text-xs"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
      >
        <ul role="listbox" className="u-dropdown-list divide-y divide-[var(--border)]">
          {options.map((o) => {
            const isSelected = o.value === value;
            return (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(o.value);
                    close();
                  }}
                  className={`w-full px-2.5 py-2 flex items-center justify-between gap-2 text-start hover:opacity-90 ${
                    isSelected ? 'font-semibold' : ''
                  }`}
                  style={{
                    color: 'var(--text)',
                    background: isSelected ? 'var(--hover-bg, color-mix(in srgb, var(--accent) 12%, transparent))' : 'transparent',
                  }}
                >
                  <span className="truncate flex items-center gap-2">
                    {o.icon}
                    {o.label}
                  </span>
                  {isSelected ? <Check className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent)' }} /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      </FloatingPopover>
    </div>
  );
};
