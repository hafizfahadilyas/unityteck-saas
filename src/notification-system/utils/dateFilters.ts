import {
  isToday,
  isThisWeek,
  isThisMonth,
  isThisYear,
  isWithinInterval,
  parseISO,
  formatDistanceToNow,
  format,
} from 'date-fns';
import { DateFilterPreset, DateFilterRange, NotificationItem } from '../types/notification.types';

export function filterNotificationsByDate(
  items: NotificationItem[],
  dateFilter: DateFilterRange,
): NotificationItem[] {
  const { preset, startDate, endDate } = dateFilter;

  return items.filter((item) => {
    let itemDate: Date;
    try {
      itemDate = parseISO(item.timestamp);
      if (isNaN(itemDate.getTime())) {
        itemDate = new Date(item.timestamp);
      }
    } catch {
      return true;
    }

    switch (preset) {
      case 'today':
        return isToday(itemDate);
      case 'week':
        return isThisWeek(itemDate, { weekStartsOn: 6 }); // Saturday in Saudi Arabia
      case 'month':
        return isThisMonth(itemDate);
      case 'yearly':
        return isThisYear(itemDate);
      case 'custom':
        if (startDate && endDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          return isWithinInterval(itemDate, { start, end });
        }
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          return itemDate >= start;
        }
        return true;
      default:
        return true;
    }
  });
}

export function formatRelativeTime(
  timestamp: string,
  locale: string = 'en',
): string {
  try {
    const date = parseISO(timestamp);
    if (isNaN(date.getTime())) return timestamp;

    const isAr = locale === 'ar';
    const now = new Date();
    const diffMinutes = Math.round((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffMinutes < 1) {
      return isAr ? 'الآن' : 'Just now';
    }
    if (diffMinutes < 60) {
      return isAr ? `منذ ${diffMinutes} دقيقة` : `${diffMinutes}m ago`;
    }
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return isAr ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`;
    }
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) {
      return isAr ? 'أمس' : 'Yesterday';
    }
    if (diffDays < 7) {
      return isAr ? `منذ ${diffDays} أيام` : `${diffDays}d ago`;
    }

    return format(date, 'MMM d, yyyy');
  } catch {
    return timestamp;
  }
}
