import React, { useState, useMemo } from 'react';
import {
  Bell,
  ArrowRight,
  Sparkles,
  Filter,
  Megaphone,
  ShieldAlert,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { NotificationItem } from '../types/notification.types';
import { DateRangeFilter } from './DateRangeFilter';
import { NotificationCard } from './NotificationCard';
import { NotificationBadge } from './NotificationBadge';
import { usePrefs } from '../../i18n/PrefsContext';
import { useDateRange } from '../../context/DateRangeContext';

interface PaginatedNotificationsProps {
  notifications: NotificationItem[];
  onAction: (item: NotificationItem) => void;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onSnooze: (id: string, minutes: number) => void;
  onViewAll?: () => void;
  className?: string;
}

type NotificationTab = 'all' | 'marketing' | 'system';

const PAGE_SIZE = 4;

export const PaginatedNotifications: React.FC<PaginatedNotificationsProps> = ({
  notifications,
  onAction,
  onMarkRead,
  onDismiss,
  onSnooze,
  onViewAll,
  className = '',
}) => {
  const { locale, dir } = usePrefs();
  const isAr = locale === 'ar';
  const dateRange = useDateRange();

  // Internal Tabs/Toggle state
  const [activeTab, setActiveTab] = useState<NotificationTab>('all');
  // Internal Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);

  // 1. Filter by Date Range
  const dateFilteredItems = useMemo(() => {
    return notifications.filter((item) => {
      try {
        const itemDate = new Date(item.timestamp);
        return itemDate >= dateRange.from && itemDate <= dateRange.to;
      } catch {
        return true;
      }
    });
  }, [notifications, dateRange.from, dateRange.to]);

  // 2. Filter by Category Tabs
  const tabFilteredItems = useMemo(() => {
    if (activeTab === 'all') return dateFilteredItems;

    if (activeTab === 'marketing') {
      const marketingCats = [
        'Marketing & Offers',
        'Special Offer',
        'Marketing',
        'Coupon',
        'Abandoned Cart',
        'Loyalty Points',
        'Cashback',
        'Social Media',
        'Google Ads',
        'Instagram',
        'Facebook',
        'TikTok',
        'Snapchat',
        'X',
        'Pinterest',
        'YouTube',
      ];
      return dateFilteredItems.filter((n) =>
        marketingCats.some((cat) => (n.category || '').toLowerCase().includes(cat.toLowerCase())),
      );
    }

    if (activeTab === 'system') {
      const systemCats = [
        'System Alerts',
        'System',
        'Operational',
        'Products & Inventory',
        'Orders',
        'Payments',
        'Shipping',
        'Security',
        'Store',
        'Sync',
        'Inventory',
        'Hostinger',
      ];
      return dateFilteredItems.filter((n) =>
        systemCats.some((cat) => (n.category || '').toLowerCase().includes(cat.toLowerCase())) ||
        n.severity === 'critical' ||
        n.severity === 'warning',
      );
    }

    return dateFilteredItems;
  }, [dateFilteredItems, activeTab]);

  // Total pages
  const totalPages = Math.max(1, Math.ceil(tabFilteredItems.length / PAGE_SIZE));
  const validPage = Math.min(currentPage, totalPages);

  // Paginated 4 items max
  const displayedItems = useMemo(() => {
    const start = (validPage - 1) * PAGE_SIZE;
    return tabFilteredItems.slice(start, start + PAGE_SIZE);
  }, [tabFilteredItems, validPage]);

  // Handle Tab Switch (resets page to 1)
  const handleTabChange = (tab: NotificationTab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const unreadCount = tabFilteredItems.filter((n) => !n.read).length;

  const TABS = [
    { key: 'all' as const, label: isAr ? 'الكل' : 'All', count: dateFilteredItems.length },
    {
      key: 'marketing' as const,
      label: isAr ? 'فرص التسويق' : 'Marketing',
      icon: Megaphone,
    },
    {
      key: 'system' as const,
      label: isAr ? 'تنبيهات النظام' : 'System Alerts',
      icon: ShieldAlert,
    },
  ];

  return (
    <div
      className={`u-panel p-4 sm:p-5 rounded-2xl shadow-sm border transition-all duration-200 ${className}`}
      data-zone="zone2-marketing-paginated"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
    >
      {/* ── Header row ── */}
      <div
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 mb-3 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        {/* Left: Bell icon + Title + Unread badge */}
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
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg tracking-tight" style={{ color: 'var(--text)' }}>
                  {isAr ? 'الإشعارات وفرص التسويق' : 'Notifications & Growth'}
                </h3>
                {unreadCount > 0 && (
                  <NotificationBadge count={unreadCount} variant="danger" pulse />
                )}
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                {isAr
                  ? `عرض 4 إشعارات لكل صفحة لمنع التمرير الطويل (${tabFilteredItems.length} إشعار)`
                  : `Showing max 4 items per page (${tabFilteredItems.length} active)`}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Date Range Filter + View All */}
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

      {/* ── Category Filter Tabs / Toggle Bar ── */}
      <div className="flex items-center justify-between gap-2 pb-3 mb-2 flex-wrap">
        <div
          className="inline-flex items-center gap-1 p-1 rounded-xl"
          style={{ background: 'var(--hover-bg)' }}
          role="tablist"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => handleTabChange(tab.key)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer"
                style={
                  isActive
                    ? {
                        background: 'var(--portal-900)',
                        color: '#ffffff',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                      }
                    : { color: 'var(--muted)' }
                }
              >
                {TabIcon && <TabIcon className="w-3.5 h-3.5" />}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
          {tabFilteredItems.length} {isAr ? 'إشعار' : 'notifications'}
        </div>
      </div>

      {/* ── Body: Paginated List of Notifications (Max 4 items) ── */}
      <div>
        {displayedItems.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>
              {isAr ? 'لا توجد إشعارات في هذا التصنيف' : 'All caught up!'}
            </p>
            <p className="text-xs max-w-sm mx-auto opacity-75">
              {isAr
                ? 'لا توجد فرص تسويقية أو إشعارات نشطة تطابق التصفية الحالية.'
                : 'No marketing opportunities or notifications for the selected category/date range.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 border rounded-xl overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            {displayedItems.map((item) => (
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

      {/* ── Pagination Bar ( < [1] [2] > ) ── */}
      {tabFilteredItems.length > PAGE_SIZE && (
        <div
          className="flex items-center justify-between pt-3.5 mt-3 border-t text-xs"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {isAr
              ? `الصفحة ${validPage} من ${totalPages}`
              : `Page ${validPage} of ${totalPages}`}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Prev Button */}
            <button
              type="button"
              disabled={validPage <= 1}
              onClick={() => handlePageChange(validPage - 1)}
              className="p-1.5 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              aria-label="Previous Page"
            >
              {dir === 'rtl' ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            {/* Page Number Buttons */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              const isActive = p === validPage;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePageChange(p)}
                  className={`min-w-[28px] h-7 px-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'border hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  style={
                    !isActive
                      ? {
                          borderColor: 'var(--border)',
                          color: 'var(--text)',
                        }
                      : undefined
                  }
                >
                  {p}
                </button>
              );
            })}

            {/* Next Button */}
            <button
              type="button"
              disabled={validPage >= totalPages}
              onClick={() => handlePageChange(validPage + 1)}
              className="p-1.5 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              aria-label="Next Page"
            >
              {dir === 'rtl' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
