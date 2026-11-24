import React, { useMemo } from 'react';
import {
  SAUDI_DIAL_PREFIX_00966,
  extractSaudiLocalDigits,
  toSaudi00966,
} from '../../utils/phone';

type Props = {
  value: string;
  onChange: (fullNumber: string) => void;
  isAr?: boolean;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  name?: string;
  className?: string;
  /** Outer shell classes (flag + prefix + input). */
  shellClassName?: string;
  placeholder?: string;
  autoComplete?: string;
};

/**
 * Saudi mobile field: 🇸🇦 + locked `00966` prefix + digits-only local part.
 * Emits full number as `009665XXXXXXXX` (or empty when no local digits yet).
 */
export const SaudiMobileInput: React.FC<Props> = ({
  value,
  onChange,
  isAr = false,
  required,
  disabled,
  id,
  name,
  className = '',
  shellClassName = '',
  placeholder,
  autoComplete = 'tel-national',
}) => {
  const localDigits = useMemo(() => extractSaudiLocalDigits(value), [value]);

  const handleChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 9);
    if (!digits) {
      onChange('');
      return;
    }
    onChange(toSaudi00966(digits));
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text') || '';
    const full = toSaudi00966(pasted);
    onChange(full || '');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const allowed = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (allowed.includes(e.key)) return;
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <div
      dir="ltr"
      className={`flex items-stretch w-full min-w-0 overflow-hidden rounded-xl border border-neutral-200/90 bg-white focus-within:border-neutral-900 ${shellClassName}`.trim()}
    >
      <span
        className="inline-flex items-center gap-1.5 shrink-0 ps-3 pe-2 text-sm font-semibold text-neutral-800 border-e border-neutral-200/90 bg-neutral-50 select-none"
        aria-hidden
      >
        <span className="text-base leading-none" title={isAr ? 'المملكة العربية السعودية' : 'Saudi Arabia'}>
          🇸🇦
        </span>
        <span className="font-mono text-xs sm:text-sm tracking-tight">{SAUDI_DIAL_PREFIX_00966}</span>
      </span>
      <input
        id={id}
        name={name}
        type="tel"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete={autoComplete}
        required={required}
        disabled={disabled}
        value={localDigits}
        minLength={required ? 9 : undefined}
        maxLength={9}
        onChange={(e) => handleChange(e.target.value)}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || (isAr ? '5xxxxxxxx' : '5xxxxxxxx')}
        aria-label={isAr ? 'رقم الجوال' : 'Mobile number'}
        className={`flex-1 min-w-0 bg-transparent px-3 py-3 text-neutral-900 font-mono text-sm outline-none disabled:opacity-60 ${className}`.trim()}
      />
    </div>
  );
};
