import React from 'react';
import { Bell, ArrowRight, Sparkles } from 'lucide-react';
import { NotificationItem } from '../types/notification.types';
import { DateRangeFilter } from './DateRangeFilter';
import { NotificationCard } from './NotificationCard';
import { NotificationBadge } from './NotificationBadge';
import { useNotificationFilter } from '../hooks/useNotificationFilter';
import { usePrefs } from '../../i18n/PrefsContext';

import { useDateRange } from '../../context/DateRangeContext';

interface NotificationsMainProps {
  notifications: NotificationItem[];
  onAction: (item: NotificationItem) => void;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onSnooze: (id: string, minutes: number) => void;
  onViewAll?: () => void;
  className?: string;
}

export const NotificationsMain: React.FC<NotificationsMainProps> = ({
  notifications,
  onAction,
  onMarkRead,
  onDismiss,
  onSnooze,
  onViewAll,
  className = '',
}) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const dateRange = useDateRange();

  const filteredItems = React.useMemo(() => {
    return notifications.filter((item) => {
      try {
        const itemDate = new Date(item.timestamp);
        return itemDate >= dateRange.from && itemDate <= dateRange.to;
      } catch {
        return true;
      }
    });
  }, [notifications, dateRange.from, dateRange.to]);

  const unreadCount = filteredItems.filter((n) => !n.read).length;

  return (
    <div
      className={`u-panel p-5 sm:p-6 rounded-2xl shadow-sm transition-all duration-200 ${className}`}
      data-zone="zone2-marketing"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
    >
      {/* ── Header row ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-2 border-b" style={{ borderColor: 'var(--border)' }}>
        {/* Left: Bell icon + "Notifications" title + Red badge with count */}
        <div className="flex items-center gap-3">
          <span
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
            style={{
              background: 'color-mix(in srgb, var(--accent) 15%, var(--surface))',
              color: 'var(--accent)',
            }}
          >
            <Bell className="w-5 h-5" />
          </span>
          <div className="flex items-center gap-2.5">
            <h3 className="font-bold text-lg tracking-tight" style={{ color: 'var(--text)' }}>
              {isAr ? 'الإشعارات وفرص التسويق' : 'Notifications'}
            </h3>
            {unreadCount > 0 && (
              <NotificationBadge count={unreadCount} variant="danger" pulse />
            )}
          </div>
        </div>

        {/* Right: Universal Date Range Filter + "View all" link (teal) */}
        <div className="flex items-center gap-3 flex-wrap">
          <DateRangeFilter />
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 transition-colors inline-flex items-center gap-1 cursor-pointer hover:underline ms-1"
          >
            <span>{isAr ? 'عرض الكل' : 'View all'}</span>
            <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </button>
        </div>
      </div>

      {/* ── Body: Vertical list of notification cards ── */}
      <div>
        {filteredItems.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>
              {isAr ? 'لا توجد إشعارات حالياً' : 'All caught up!'}
            </p>
            <p className="text-xs max-w-sm mx-auto opacity-75">
              {isAr
                ? 'لا توجد فرص تسويقية أو إشعارات غير مقروءة في هذا النطاق الزمني.'
                : 'No marketing opportunities or notifications for the selected date range.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredItems.map((item) => (
              <NotificationCard
                key={item.id}
                notification={item}
                onAction={onAction}
                onMarkRead={onMarkRead}
                onDismiss={onDismiss}
                onSnooze={onSnooze}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
