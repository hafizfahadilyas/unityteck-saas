import React, { useMemo } from 'react';
import type { OrderStatus } from '../../../types';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useTenant } from '../../../context/TenantContext';
import { getStoreOrderStatusOptions } from '../../../utils/orderStatuses';
import { ChevronDown } from 'lucide-react';

const STATUS_TONE: Record<string, string> = {
  draft:
    'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  deleted:
    'bg-[#FEEBEB] text-[#DC2626] border-[#FECACA] dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800',
  pending:
    'bg-[#FEF6EB] text-[#D97706] border-[#FDE68A] dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
  awaiting_payment:
    'bg-[#FEF6EB] text-[#D97706] border-[#FDE68A] dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
  partially_paid:
    'bg-[#FEF6EB] text-[#D97706] border-[#FDE68A] dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
  pending_review:
    'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
  processing:
    'bg-[#EBF4FE] text-[#2563EB] border-[#BFDBFE] dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800',
  preparing:
    'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
  shipped:
    'bg-[#F3EBFD] text-[#7C3AED] border-[#DDD6FE] dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800',
  out_for_delivery:
    'bg-[#FEF7EB] text-[#B45309] border-[#FDE68A] dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
  delivered:
    'bg-[#EBF8F2] text-[#059669] border-[#A7F3D0] dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
  completed:
    'bg-[#EBF8F2] text-[#059669] border-[#A7F3D0] dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
  cancellation_requested:
    'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700',
  cancelled:
    'bg-[#FEEBEB] text-[#DC2626] border-[#FECACA] dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800',
  returned:
    'bg-[#FFF1F2] text-[#E11D48] border-[#FFE4E6] dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800',
  return_in_progress:
    'bg-[#FFF1F2] text-[#E11D48] border-[#FFE4E6] dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800',
  rfq:
    'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  refunded:
    'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
};

interface OrderStatusSelectProps {
  value: OrderStatus | string;
  onChange: (next: OrderStatus) => void;
  disabled?: boolean;
  className?: string;
  /** Compact for table cells; default true */
  compact?: boolean;
}

/**
 * Shared instant order-status changer — same options everywhere.
 * Updates fire on select (optimistic); no save button.
 */
export const OrderStatusSelect: React.FC<OrderStatusSelectProps> = ({
  value,
  onChange,
  disabled = false,
  className = '',
  compact = true,
}) => {
  const { locale } = usePrefs();
  const { activeStore } = useTenant();
  const isAr = locale === 'ar';
  const key = String(value || 'pending').toLowerCase().replace(/[\s-]+/g, '_');
  const tone =
    STATUS_TONE[key] ||
    'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';

  const options = useMemo(
    () => getStoreOrderStatusOptions(activeStore?.id),
    [activeStore?.id],
  );
  const known = options.some((o) => o.value === value || o.value === key);
  const selectValue = known ? (options.some((o) => o.value === value) ? value : key) : key;

  return (
    <div className={`relative inline-flex max-w-full ${className}`}>
      <select
        value={selectValue}
        disabled={disabled}
        onChange={(e) => {
          const next = e.target.value as OrderStatus;
          if (next === value) return;
          onChange(next);
        }}
        onClick={(e) => e.stopPropagation()}
        className={`appearance-none cursor-pointer font-bold border rounded-full pe-6 focus:outline-hidden focus:ring-2 focus:ring-teal-500/30 disabled:opacity-60 disabled:cursor-not-allowed ${tone} ${
          compact ? 'ps-2.5 py-1 text-[11px]' : 'ps-3.5 py-2 text-xs rounded-xl pe-8'
        }`}
        aria-label={isAr ? 'تغيير حالة الطلب' : 'Change order status'}
        title={isAr ? 'تغيير الحالة فوراً' : 'Change status instantly'}
      >
        {!known && value ? (
          <option value={selectValue}>{String(value)}</option>
        ) : null}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {isAr ? opt.labelAr : opt.labelEn}
          </option>
        ))}
      </select>
      <ChevronDown
        className={`pointer-events-none absolute end-1.5 top-1/2 -translate-y-1/2 opacity-70 ${
          compact ? 'w-3 h-3' : 'w-3.5 h-3.5 end-2.5'
        }`}
      />
    </div>
  );
};
