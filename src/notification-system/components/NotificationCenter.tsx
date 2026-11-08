/**
 * @file NotificationCenter.tsx
 * Full-page / Modal view meeting Rule 10:
 * - Three zones matching tabs (Issues / Marketing / Urgent / All)
 * - Advanced filters: universal date range, type/category, severity, status
 * - Bulk actions: mark all read, dismiss selected
 * - Search bar
 * - Export to CSV
 */

import React, { useMemo, useState } from 'react';
import {
  Bell,
  X,
  Search,
  CheckCheck,
  Download,
  Sparkles,
  Trash2,
  Mail,
  LayoutList,
} from 'lucide-react';
import { NotificationItem, NotificationZone } from '../types/notification.types';
import { NotificationCard } from './NotificationCard';
import { DateRangeFilter } from './DateRangeFilter';
import { CustomerDeliveriesPanel } from './CustomerDeliveriesPanel';
import { useDateRange } from '../../context/DateRangeContext';
import { format } from 'date-fns';
import { usePrefs } from '../../i18n/PrefsContext';

interface NotificationCenterProps {
  isOpen?: boolean;
  onClose?: () => void;
  notifications: NotificationItem[];
  onAction: (item: NotificationItem) => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: (zone?: NotificationZone) => void;
  onDismiss: (id: string) => void;
  onSnooze: (id: string, minutes: number) => void;
  isFullPage?: boolean;
  /** Active store id — enables real Email/WhatsApp/SMS delivery manage tab */
  storeId?: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen = true,
  onClose,
  notifications,
  onAction,
  onMarkRead,
  onMarkAllRead,
  onDismiss,
  onSnooze,
  isFullPage = false,
  storeId,
}) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const dateRange = useDateRange();

  const [mainView, setMainView] = useState<'inbox' | 'customer'>('inbox');
  const [activeZoneTab, setActiveZoneTab] = useState<'all' | 'unread' | 'read' | NotificationZone>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter items
  const filteredItems = useMemo(() => {
    let list = notifications;

    // 1. Zone / Status tab
    if (activeZoneTab === 'unread') {
      list = list.filter((n) => !n.read);
    } else if (activeZoneTab === 'read') {
      list = list.filter((n) => n.read);
    } else if (activeZoneTab !== 'all') {
      list = list.filter((n) => n.zone === activeZoneTab);
    }

    // 2. Category filter
    if (selectedCategory !== 'all') {
      list = list.filter((item) => (item.category || '').toLowerCase().includes(selectedCategory.toLowerCase()));
    }

    // 3. Date range boundary filtering
    list = list.filter((item) => {
      try {
        const itemDate = new Date(item.timestamp);
        return itemDate >= dateRange.from && itemDate <= dateRange.to;
      } catch {
        return true;
      }
    });

    // 4. Search query
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          (item.titleAr && item.titleAr.toLowerCase().includes(q)),
      );
    }

    // 5. Severity filter
    if (selectedSeverity !== 'all') {
      list = list.filter((item) => item.severity === selectedSeverity);
    }

    // 6. Status filter (unread, read, dismissed)
    if (selectedStatus === 'unread') {
      list = list.filter((item) => !item.read);
    } else if (selectedStatus === 'read') {
      list = list.filter((item) => item.read);
    }

    return list;
  }, [notifications, activeZoneTab, selectedCategory, dateRange.from, dateRange.to, searchQuery, selectedSeverity, selectedStatus]);

  // Bulk actions: select/deselect
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDismissSelected = () => {
    selectedIds.forEach((id) => onDismiss(id));
    setSelectedIds(new Set());
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Zone', 'Category', 'Severity', 'Title', 'Description', 'Timestamp', 'Status'];
    const rows = filteredItems.map((item) => [
      item.id,
      item.zone,
      item.category,
      item.severity,
      `"${item.title.replace(/"/g, '""')}"`,
      `"${item.description.replace(/"/g, '""')}"`,
      item.timestamp,
      item.read ? 'read' : 'unread',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `souq-notifications-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isFullPage && !isOpen) return null;

  const content = (
    <div
      className={`w-full ${
        isFullPage
          ? 'h-full flex flex-col p-4 sm:p-6'
          : 'max-w-5xl h-[92vh] max-h-[900px] rounded-2xl shadow-2xl border flex flex-col overflow-hidden animate-in zoom-in-95 duration-150'
      }`}
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        color: 'var(--text)',
      }}
    >
      {/* ── Top Header ── */}
      <div className="px-5 py-4 border-b flex flex-col gap-3 shrink-0" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-black tracking-tight truncate" style={{ color: 'var(--text)' }}>
                {isAr ? 'مركز الإشعارات' : 'Notification Center'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {mainView === 'customer'
                  ? isAr
                    ? 'إدارة إشعارات العميل عبر الإيميل وواتساب والرسائل النصية'
                    : 'Manage real customer Email, WhatsApp & SMS deliveries'
                  : isAr
                    ? `إدارة التنبيهات والفرص (${filteredItems.length})`
                    : `Manage store alerts & opportunities (${filteredItems.length})`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {mainView === 'inbox' && (
              <>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 rounded-xl border text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isAr ? 'تصدير' : 'Export'}</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onMarkAllRead(
                      activeZoneTab === 'all' || activeZoneTab === 'unread' || activeZoneTab === 'read'
                        ? undefined
                        : (activeZoneTab as NotificationZone),
                    )
                  }
                  className="px-3 py-1.5 rounded-xl border text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">{isAr ? 'قراءة الكل' : 'Mark all read'}</span>
                </button>
              </>
            )}

            {selectedIds.size > 0 && mainView === 'inbox' && (
              <button
                type="button"
                onClick={handleDismissSelected}
                className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isAr ? `حذف (${selectedIds.size})` : `Dismiss (${selectedIds.size})`}</span>
              </button>
            )}

            {!isFullPage && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Inbox vs Customer deliveries */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100/80 dark:bg-slate-900/60 w-full sm:w-auto self-start">
          <button
            type="button"
            onClick={() => setMainView('inbox')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-all ${
              mainView === 'inbox'
                ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <LayoutList className="w-3.5 h-3.5" />
            {isAr ? 'صندوق المتجر' : 'Store inbox'}
          </button>
          <button
            type="button"
            onClick={() => setMainView('customer')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-all ${
              mainView === 'customer'
                ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            {isAr ? 'إشعارات العميل' : 'Customer Email / WA / SMS'}
          </button>
        </div>
      </div>

      {mainView === 'customer' && storeId ? (
        <div className="flex-1 min-h-0 overflow-hidden">
          <CustomerDeliveriesPanel storeId={storeId} />
        </div>
      ) : mainView === 'customer' && !storeId ? (
        <div className="flex-1 flex items-center justify-center text-xs text-slate-500 p-8">
          {isAr ? 'اختر متجراً لعرض سجلات الإرسال' : 'Select a store to view delivery logs'}
        </div>
      ) : (
        <>

      {/* ── Zone & Status Filter Tabs & Universal Date Filter ── */}
      <div className="px-5 py-3 border-b flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 bg-slate-50/50 dark:bg-slate-900/50" style={{ borderColor: 'var(--border)' }}>
        {/* Zone & Status Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'all' as const, labelEn: 'All Alerts', labelAr: 'كافة الإشعارات' },
            { id: 'unread' as const, labelEn: 'New (Unread)', labelAr: 'الجديدة (غير مقروءة)' },
            { id: 'read' as const, labelEn: 'Old (Read)', labelAr: 'السابقة (مقروءة)' },
            { id: 'zone1_issues' as const, labelEn: 'Operational (Zone 1)', labelAr: 'التنبيهات التشغيلية' },
            { id: 'zone2_marketing' as const, labelEn: 'Marketing (Zone 2)', labelAr: 'الفرص التسويقية' },
            { id: 'zone3_urgent' as const, labelEn: 'Urgent (Zone 3)', labelAr: 'إجراءات عاجلة' },
          ].map((tab) => {
            const active = activeZoneTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveZoneTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                {isAr ? tab.labelAr : tab.labelEn}
              </button>
            );
          })}
        </div>

        {/* Universal Date Range Filter */}
        <DateRangeFilter />
      </div>

      {/* ── Search Bar & Advanced Filters ── */}
      <div className="px-5 py-2.5 border-b flex items-center justify-between gap-3 shrink-0 flex-wrap" style={{ borderColor: 'var(--border)' }}>
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder={isAr ? 'بحث في الإشعارات والفرص...' : 'Search by title, category, order or customer...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full ps-9 pe-3 py-1.5 text-xs rounded-xl border outline-none focus:border-emerald-500"
            style={{
              background: 'var(--input-bg)',
              borderColor: 'var(--border)',
              color: 'var(--input-fg)',
            }}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-xl border outline-none font-medium"
            style={{
              background: 'var(--input-bg)',
              borderColor: 'var(--border)',
              color: 'var(--input-fg)',
            }}
          >
            <option value="all">{isAr ? 'كافة التصنيفات' : 'All Categories'}</option>
            <option value="order">{isAr ? 'الطلبات' : 'Orders'}</option>
            <option value="inventory">{isAr ? 'المخزون والمنتجات' : 'Inventory'}</option>
            <option value="marketing">{isAr ? 'التسويق والعروض' : 'Marketing'}</option>
            <option value="customer">{isAr ? 'العملاء' : 'Customers'}</option>
            <option value="payment">{isAr ? 'المدفوعات' : 'Payments'}</option>
            <option value="security">{isAr ? 'الأمان والاستضافة' : 'Security'}</option>
          </select>

          {/* Severity filter */}
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-xl border outline-none font-medium"
            style={{
              background: 'var(--input-bg)',
              borderColor: 'var(--border)',
              color: 'var(--input-fg)',
            }}
          >
            <option value="all">{isAr ? 'كافة المستويات' : 'All Severities'}</option>
            <option value="critical">{isAr ? 'حرج فقط' : 'Critical'}</option>
            <option value="warning">{isAr ? 'تحذيرات' : 'Warnings'}</option>
            <option value="opportunity">{isAr ? 'فرص نمو' : 'Opportunities'}</option>
            <option value="info">{isAr ? 'معلومات عامة' : 'Info'}</option>
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-xl border outline-none font-medium"
            style={{
              background: 'var(--input-bg)',
              borderColor: 'var(--border)',
              color: 'var(--input-fg)',
            }}
          >
            <option value="all">{isAr ? 'جميع الحالات' : 'All Statuses'}</option>
            <option value="unread">{isAr ? 'غير مقروء (جديد)' : 'Unread (New)'}</option>
            <option value="read">{isAr ? 'مقروء (قديم)' : 'Read (Old)'}</option>
          </select>
        </div>
      </div>

      {/* ── Scrollable Notifications Body ── */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 custom-scrollbar">
        {filteredItems.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-500 dark:text-slate-400">
            <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>
              {isAr ? 'لا توجد إشعارات مطابقة' : 'No notifications match your filter'}
            </p>
            <p className="mt-1 opacity-75">
              {isAr ? 'جرب تغيير فترة التاريخ أو مسح كلمات البحث.' : 'Try adjusting the date range preset or search query.'}
            </p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div key={item.id} className="flex items-start gap-0">
              <div className="ps-3 pe-1 pt-4 flex items-center self-stretch">
                <input
                  type="checkbox"
                  checked={selectedIds.has(item.id)}
                  onChange={() => toggleSelect(item.id)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                  aria-label="Select notification"
                />
              </div>
              <div className="flex-1 min-w-0">
                <NotificationCard
                  notification={item}
                  onAction={(it) => {
                    onAction(it);
                    if (!isFullPage && onClose) onClose();
                  }}
                  onMarkRead={onMarkRead}
                  onDismiss={onDismiss}
                  onSnooze={onSnooze}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Footer ── */}
      <div className="px-5 py-3 border-t flex items-center justify-between text-xs text-slate-500 shrink-0" style={{ borderColor: 'var(--border)' }}>
        <span>
          {isAr
            ? `إجمالي الإشعارات في الفترة (${dateRange.preset}):${filteredItems.length}`
            : `Showing ${filteredItems.length} alerts for period: ${dateRange.labelEn}`}
        </span>
        {!isFullPage && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold transition-colors cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        )}
      </div>
        </>
      )}
    </div>
  );

  if (isFullPage) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-200">
      {content}
    </div>
  );
};

export default NotificationCenter;
