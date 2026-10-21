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
    let date = parseISO(timestamp);
    if (isNaN(date.getTime())) {
      date = new Date(timestamp.includes(' ') ? timestamp.replace(' ', 'T') : timestamp);
    }
    if (isNaN(date.getTime())) return timestamp;

    const isAr = locale === 'ar';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) {
      return isAr ? 'الآن' : 'Just now';
    }
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) {
      return isAr ? 'الآن' : 'Just now';
    }
    if (diffMinutes === 1) {
      return isAr ? 'منذ دقيقة' : '1 minute ago';
    }
    if (diffMinutes === 2) {
      return isAr ? 'منذ دقيقتين' : '2 minutes ago';
    }
    if (diffMinutes < 60) {
      return isAr ? `منذ ${diffMinutes} دقيقة` : `${diffMinutes} minutes ago`;
    }
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours === 1) {
      return isAr ? 'منذ ساعة' : '1 hour ago';
    }
    if (diffHours === 2) {
      return isAr ? 'منذ ساعتين' : '2 hours ago';
    }
    if (diffHours < 24) {
      return isAr ? `منذ ${diffHours} ساعات` : `${diffHours} hours ago`;
    }
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) {
      return isAr ? 'أمس' : 'Yesterday';
    }
    if (diffDays === 2) {
      return isAr ? 'منذ يومين' : '2 days ago';
    }
    if (diffDays < 7) {
      return isAr ? `منذ ${diffDays} أيام` : `${diffDays} days ago`;
    }

    return format(date, 'MMM d, yyyy');
  } catch {
    return timestamp;
  }
}
