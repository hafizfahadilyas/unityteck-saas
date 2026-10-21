import React from 'react';
import { Database, AlertCircle } from 'lucide-react';
import { usePrefs } from '../../../i18n/PrefsContext';

interface ReportsEmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const ReportsEmptyState: React.FC<ReportsEmptyStateProps> = ({
  title,
  description,
  icon: Icon = Database,
  actionLabel,
  onAction,
  className = '',
}) => {
  const { locale, dir } = usePrefs();
  const isAr = locale === 'ar';

  const defaultTitle = isAr ? 'لا توجد بيانات مسجلة' : 'No records found';
  const defaultDesc = isAr
    ? 'لم يتم تسجيل أي معاملات أو بيانات في هذه الفترة لمتجرك الحالي.'
    : 'No transactions or data points recorded for your active store in this timeframe.';

  return (
    <div
      dir={dir}
      className={`p-8 sm:p-12 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col items-center justify-center space-y-3.5 transition-all ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 shadow-2xs">
        <Icon className="w-7 h-7" />
      </div>

      <div className="max-w-md space-y-1">
        <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
          {title || defaultTitle}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {description || defaultDesc}
        </p>
      </div>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
