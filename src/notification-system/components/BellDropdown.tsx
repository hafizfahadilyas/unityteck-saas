/**
 * @file BellDropdown.tsx
 * Top Navigation Bell Dropdown meeting Rule 9:
 * - Shows total unread count across all zones
 * - Multi-tab filter: All / Issues / Marketing / Urgent (Last 10 per tab)
 * - "View notification center" link at bottom
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  ArrowRight,
  AlertTriangle,
  Sparkles,
  ShieldAlert,
  Layers,
  CheckCheck,
} from 'lucide-react';
import { NotificationItem, NotificationZone } from '../types/notification.types';
import { useNotifications } from '../hooks/useNotifications';
import { formatRelativeTime } from '../utils/dateFilters';
import { usePrefs } from '../../i18n/PrefsContext';

interface BellDropdownProps {
  onOpenNotificationCenter?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const BellDropdown: React.FC<BellDropdownProps> = ({
  onOpenNotificationCenter,
  onNavigateTab,
}) => {
  const {
    notifications,
    zone1Items,
    zone2Items,
    zone3Items,
    unreadCounts,
    markAsRead,
    markAllAsRead,
    handleAction,
  } = useNotifications();

  const { locale, t } = usePrefs();
  const isAr = locale === 'ar';

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | NotificationZone>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const currentTabItems = React.useMemo(() => {
    let list: NotificationItem[] = [];
    if (activeTab === 'all') list = notifications;
    else if (activeTab === 'zone1_issues') list = zone1Items;
    else if (activeTab === 'zone2_marketing') list = zone2Items;
    else if (activeTab === 'zone3_urgent') list = zone3Items;
    return list.slice(0, 10); // Last 10 notifications per tab
  }, [activeTab, notifications, zone1Items, zone2Items, zone3Items]);

  const totalCount = unreadCounts.total;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        title={t('notifications')}
        aria-label={t('notifications')}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((v) => !v)}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer hover:bg-slate-500/10 text-slate-700 dark:text-slate-200 select-none shrink-0"
      >
        <Bell className="w-4 h-4" aria-hidden />
        {totalCount > 0 && (
          <span
            className="absolute -top-0.5 -end-0.5 min-w-[18px] h-[18px] px-1 text-white rounded-full text-[10px] font-bold flex items-center justify-center border-2 shadow-xs leading-none"
            style={{
              background: '#ef4444',
              borderColor: 'var(--surface)',
            }}
          >
            {totalCount > 99 ? '99+' : totalCount}
          </span>
        )}
      </button>

      {/* Dropdown Content */}
      {isOpen && (
        <div
          role="menu"
          className="absolute end-0 mt-2 w-80 sm:w-96 rounded-2xl border shadow-2xl z-50 text-xs overflow-hidden backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)',
            color: 'var(--text)',
          }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">{t('notifications')}</span>
              {totalCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                  {totalCount}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => markAllAsRead()}
              className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>{isAr ? 'قراءة الكل' : 'Mark all read'}</span>
            </button>
          </div>

          {/* 4 Tabs: All / Issues / Marketing / Urgent */}
          <div className="flex items-center border-b px-2 pt-1 gap-1 bg-slate-50/50 dark:bg-slate-900/50" style={{ borderColor: 'var(--border)' }}>
            {[
              { id: 'all' as const, labelEn: 'All', labelAr: 'الكل', count: unreadCounts.total },
              { id: 'zone1_issues' as const, labelEn: 'Issues', labelAr: 'التنبيهات', count: unreadCounts.zone1 },
              { id: 'zone2_marketing' as const, labelEn: 'Marketing', labelAr: 'التسويق', count: unreadCounts.zone2 },
              { id: 'zone3_urgent' as const, labelEn: 'Urgent', labelAr: 'عاجل', count: unreadCounts.zone3 },
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-1.5 text-center text-[11px] font-bold border-b-2 transition-colors cursor-pointer ${
                    active
                      ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <span>{isAr ? tab.labelAr : tab.labelEn}</span>
                  {tab.count > 0 && (
                    <span className="ms-1 px-1 rounded-full text-[9px] bg-slate-200 dark:bg-slate-700">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Body: Last 10 notifications */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 custom-scrollbar">
            {currentTabItems.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                {isAr ? 'لا توجد إشعارات في هذا القسم' : 'No notifications in this category'}
              </div>
            ) : (
              currentTabItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    handleAction(item, onNavigateTab);
                    setIsOpen(false);
                  }}
                  className={`p-3 transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                    item.read ? 'opacity-70' : 'bg-emerald-50/20 font-semibold'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold truncate leading-snug" style={{ color: 'var(--text)' }}>
                      {isAr ? item.titleAr || item.title : item.title}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {formatRelativeTime(item.timestamp, locale)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                    {isAr ? item.descriptionAr || item.description : item.description}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Footer: View notification center link */}
          <div className="p-2.5 border-t text-center bg-slate-50 dark:bg-slate-900/60" style={{ borderColor: 'var(--border)' }}>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                if (onOpenNotificationCenter) {
                  onOpenNotificationCenter();
                } else if (onNavigateTab) {
                  onNavigateTab('notifications');
                }
              }}
              className="w-full py-1 text-xs font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 inline-flex items-center justify-center gap-1.5 cursor-pointer hover:underline"
            >
              <span>{isAr ? 'فتح مركز الإشعارات الكامل' : 'View notification center'}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
