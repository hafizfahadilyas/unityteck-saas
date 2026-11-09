/**
 * @file BellDropdown.tsx
 * Header bell — Orders + Customers only (other page alerts stay out of header).
 * Alignment locked to Holst topbar controls (h-9, end-anchored panel).
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Bell,
  ArrowRight,
  CheckCheck,
  ShoppingCart,
  Users,
  Layers,
} from 'lucide-react';
import { NotificationItem } from '../types/notification.types';
import { useNotifications } from '../hooks/useNotifications';
import { formatRelativeTime } from '../utils/dateFilters';
import { usePrefs } from '../../i18n/PrefsContext';

type HeaderTab = 'all' | 'orders' | 'customers';

interface BellDropdownProps {
  onOpenNotificationCenter?: () => void;
  onNavigateTab?: (tab: string) => void;
}

function isOrderBellItem(item: NotificationItem): boolean {
  const cat = (item.category || '').toLowerCase();
  const dest = (item.destination || '').toLowerCase();
  if (dest === 'orders') return true;
  if (cat === 'orders' || cat.includes('order')) return true;
  if (cat === 'payment' || cat.includes('payment')) return true;
  return false;
}

function isCustomerBellItem(item: NotificationItem): boolean {
  const cat = (item.category || '').toLowerCase();
  const dest = (item.destination || '').toLowerCase();
  if (dest === 'customers') return true;
  if (cat.includes('customer')) return true;
  return false;
}

/** Header bell scope: Orders + Customers only — no marketing/SEO/inventory/etc. */
function isHeaderBellItem(item: NotificationItem): boolean {
  return isOrderBellItem(item) || isCustomerBellItem(item);
}

export const BellDropdown: React.FC<BellDropdownProps> = ({
  onOpenNotificationCenter,
  onNavigateTab,
}) => {
  const {
    notifications,
    markAsRead,
    handleAction,
  } = useNotifications();

  const { locale, t } = usePrefs();
  const isAr = locale === 'ar';

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<HeaderTab>('all');
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

  const headerItems = useMemo(
    () => notifications.filter(isHeaderBellItem),
    [notifications],
  );

  const orderItems = useMemo(
    () => headerItems.filter(isOrderBellItem),
    [headerItems],
  );

  const customerItems = useMemo(
    () => headerItems.filter(isCustomerBellItem),
    [headerItems],
  );

  const unreadTotal = useMemo(
    () => headerItems.filter((n) => !n.read).length,
    [headerItems],
  );
  const unreadOrders = useMemo(
    () => orderItems.filter((n) => !n.read).length,
    [orderItems],
  );
  const unreadCustomers = useMemo(
    () => customerItems.filter((n) => !n.read).length,
    [customerItems],
  );

  const currentTabItems = useMemo(() => {
    let list: NotificationItem[] = headerItems;
    if (activeTab === 'orders') list = orderItems;
    else if (activeTab === 'customers') list = customerItems;
    return list.slice(0, 10);
  }, [activeTab, headerItems, orderItems, customerItems]);

  const markHeaderAllRead = () => {
    headerItems.forEach((item) => {
      if (!item.read) markAsRead(item.id);
    });
  };

  const openRelatedPage = () => {
    setIsOpen(false);
    if (onOpenNotificationCenter) {
      onOpenNotificationCenter();
      return;
    }
    if (!onNavigateTab) return;
    if (activeTab === 'customers') onNavigateTab('customers');
    else onNavigateTab('orders');
  };

  return (
    <div className="relative flex items-center shrink-0 self-center" ref={dropdownRef}>
      <button
        type="button"
        title={t('notifications')}
        aria-label={t('notifications')}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((v) => !v)}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer hover:bg-slate-500/10 text-slate-700 dark:text-slate-200 select-none shrink-0 leading-none"
      >
        <Bell className="w-4 h-4 shrink-0" aria-hidden />
        {unreadTotal > 0 && (
          <span
            className="absolute -top-0.5 -end-0.5 min-w-[18px] h-[18px] px-1 text-white rounded-full text-[10px] font-bold flex items-center justify-center border-2 shadow-xs leading-none"
            style={{
              background: '#ef4444',
              borderColor: 'var(--surface)',
            }}
          >
            {unreadTotal > 99 ? '99+' : unreadTotal}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute end-0 top-full mt-2 w-[min(100vw-1.25rem,22rem)] sm:w-[24rem] max-w-[calc(100vw-1.25rem)] rounded-2xl border shadow-2xl z-[80] text-xs overflow-hidden backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)',
            color: 'var(--text)',
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 border-b flex items-center justify-between gap-3 min-h-[48px]"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-bold text-sm truncate">{t('notifications')}</span>
              {unreadTotal > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white shrink-0 leading-none">
                  {unreadTotal}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={markHeaderAllRead}
              disabled={unreadTotal === 0}
              className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer shrink-0"
            >
              <CheckCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">{isAr ? 'قراءة الكل' : 'Mark all read'}</span>
            </button>
          </div>

          {/* Tabs: All / Orders / Customers — equal columns, no wrap */}
          <div
            className="grid grid-cols-3 border-b bg-slate-50/50 dark:bg-slate-900/50"
            style={{ borderColor: 'var(--border)' }}
          >
            {(
              [
                {
                  id: 'all' as const,
                  labelEn: 'All',
                  labelAr: 'الكل',
                  count: unreadTotal,
                  Icon: Layers,
                },
                {
                  id: 'orders' as const,
                  labelEn: 'Orders',
                  labelAr: 'الطلبات',
                  count: unreadOrders,
                  Icon: ShoppingCart,
                },
                {
                  id: 'customers' as const,
                  labelEn: 'Customers',
                  labelAr: 'العملاء',
                  count: unreadCustomers,
                  Icon: Users,
                },
              ] as const
            ).map((tab) => {
              const active = activeTab === tab.id;
              const Icon = tab.Icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`min-h-[40px] px-1 py-2 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 text-center text-[10px] sm:text-[11px] font-bold border-b-2 transition-colors cursor-pointer ${
                    active
                      ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" aria-hidden />
                  <span className="inline-flex items-center justify-center gap-0.5 leading-none">
                    <span className="whitespace-nowrap">{isAr ? tab.labelAr : tab.labelEn}</span>
                    {tab.count > 0 && (
                      <span className="px-1 min-w-[16px] rounded-full text-[9px] bg-slate-200 dark:bg-slate-700 leading-4 shrink-0">
                        {tab.count}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {/* List */}
          <div className="max-h-[min(360px,50vh)] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 custom-scrollbar">
            {currentTabItems.length === 0 ? (
              <div className="py-10 px-4 text-center text-xs text-slate-400 leading-relaxed">
                {isAr
                  ? 'لا توجد إشعارات للطلبات أو العملاء'
                  : 'No order or customer notifications'}
              </div>
            ) : (
              currentTabItems.map((item) => {
                const orderLike = isOrderBellItem(item);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      handleAction(item, onNavigateTab);
                      setIsOpen(false);
                    }}
                    className={`w-full text-start px-4 py-3 transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                      item.read ? 'opacity-75' : 'bg-emerald-50/25 dark:bg-emerald-950/20'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          orderLike
                            ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                            : 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                        }`}
                        aria-hidden
                      >
                        {orderLike ? (
                          <ShoppingCart className="w-3.5 h-3.5" />
                        ) : (
                          <Users className="w-3.5 h-3.5" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1 grid grid-cols-[1fr_auto] gap-x-2 gap-y-1 items-start">
                        <span
                          className={`text-xs leading-snug line-clamp-2 text-start ${
                            item.read ? 'font-semibold' : 'font-bold'
                          }`}
                          style={{ color: 'var(--text)' }}
                        >
                          {isAr ? item.titleAr || item.title : item.title}
                        </span>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap pt-0.5 text-end leading-none shrink-0">
                          {formatRelativeTime(item.timestamp, locale)}
                        </span>
                        <p className="text-[11px] text-slate-500 line-clamp-2 col-span-2 leading-relaxed text-start">
                          {isAr ? item.descriptionAr || item.description : item.description}
                        </p>
                        <span className="col-span-2 text-[9px] font-bold uppercase tracking-wide text-slate-400 text-start">
                          {orderLike
                            ? isAr
                              ? 'طلب'
                              : 'Order'
                            : isAr
                              ? 'عميل'
                              : 'Customer'}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer → Orders / Customers (notifications page hidden) */}
          <div
            className="p-2.5 border-t text-center bg-slate-50 dark:bg-slate-900/60"
            style={{ borderColor: 'var(--border)' }}
          >
            <button
              type="button"
              onClick={openRelatedPage}
              className="w-full min-h-[36px] py-1.5 text-xs font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 inline-flex items-center justify-center gap-1.5 cursor-pointer hover:underline"
            >
              <span>
                {activeTab === 'customers'
                  ? isAr
                    ? 'فتح صفحة العملاء'
                    : 'Open customers'
                  : isAr
                    ? 'فتح صفحة الطلبات'
                    : 'Open orders'}
              </span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180 shrink-0" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
