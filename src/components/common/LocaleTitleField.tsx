import React from 'react';

type Props = {
  isAr: boolean;
  valueEn: string;
  valueAr: string;
  onChangeEn: (v: string) => void;
  onChangeAr: (v: string) => void;
  /** English chrome label (no language tag — locale decides the field). */
  labelEn?: string;
  /** Arabic chrome label. */
  labelAr?: string;
  placeholderEn?: string;
  placeholderAr?: string;
  required?: boolean;
  maxLength?: number;
  className?: string;
  inputClassName?: string;
  hintEn?: string;
  hintAr?: string;
};

/**
 * Single title/heading input for active portal locale.
 * AR UI → edits Arabic value only; EN UI → English only. Other language stays as previously saved.
 */
export const LocaleTitleField: React.FC<Props> = ({
  isAr,
  valueEn,
  valueAr,
  onChangeEn,
  onChangeAr,
  labelEn = 'Title',
  labelAr = 'العنوان',
  placeholderEn,
  placeholderAr,
  required,
  maxLength,
  className,
  inputClassName = 'w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20',
  hintEn,
  hintAr,
}) => {
  const value = isAr ? valueAr : valueEn;
  const onChange = isAr ? onChangeAr : onChangeEn;
  const label = isAr ? labelAr : labelEn;
  const placeholder = isAr ? placeholderAr : placeholderEn;
  const hint = isAr ? hintAr : hintEn;

  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
        {label}
        {required ? ' *' : ''}
      </label>
      <input
        type="text"
        required={required}
        dir={isAr ? 'rtl' : 'ltr'}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={inputClassName}
      />
      {(hint || maxLength != null) && (
        <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 gap-2">
          <span>{hint || ''}</span>
          {maxLength != null ? <span>{(value || '').length}/{maxLength}</span> : null}
        </div>
      )}
    </div>
  );
};

export default LocaleTitleField;
