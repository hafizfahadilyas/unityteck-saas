import React, { useState } from 'react';
import { Activity, ChevronRight, ShoppingCart, MessageCircle, User, Star, Package } from 'lucide-react';
import { usePrefs } from '../../../i18n/PrefsContext';
import { Order, Customer, Product } from '../../../types';
import { getCustomerDisplayName } from '../../../utils/storeLocalization';
import { formatRelativeTime } from '../../../notification-system/utils/dateFilters';

interface ActivityItem {
  id: string;
  type: 'order' | 'whatsapp' | 'register' | 'review';
  userName: string;
  actionMainEn: string;
  actionMainAr: string;
  subEn: string;
  subAr: string;
  image?: string;
  isAvatar?: boolean;
  timestampMs: number;
}

interface RecentActivityCardProps {
  orders?: Order[];
  customers?: Customer[];
  products?: Product[];
  onViewAll: () => void;
  onNavigateOrder?: (orderId: string) => void;
}

export const RecentActivityCard: React.FC<RecentActivityCardProps> = React.memo(({
  orders = [],
  customers = [],
  products = [],
  onViewAll,
  onNavigateOrder,
}) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Parse any valid date or timestamp into a millisecond number for accurate descending sort
  const getTimestampMs = (val?: string): number => {
    if (!val) return 0;
    try {
      const parsed = Date.parse(val.includes(' ') ? val.replace(' ', 'T') : val);
      return isNaN(parsed) ? 0 : parsed;
    } catch {
      return 0;
    }
  };

  // Build authentic activity items strictly from real store data (memoized for ultra-fast renders)
  const displayActivities = React.useMemo<ActivityItem[]>(() => {
    const activities: ActivityItem[] = [];

    // 1. Real store orders
    if (Array.isArray(orders) && orders.length > 0) {
      orders.forEach((ord) => {
        const cleanNum = ord.orderNumber
          ? (ord.orderNumber.startsWith('#') ? ord.orderNumber : `#${ord.orderNumber}`)
          : `#${ord.id ? ord.id.slice(0, 8) : 'ORD'}`;

        const cName = getCustomerDisplayName(ord.customerName, locale) || (isAr ? 'عميل' : 'Customer');

        const rawDateStr =
          ord.createdAt ||
          (ord.date && ord.time ? `${ord.date}T${ord.time}` : ord.date) ||
          ord.paymentDate;

        const timeAgoEn = rawDateStr ? formatRelativeTime(rawDateStr, 'en') : (ord.time || ord.date || '');
        const timeAgoAr = rawDateStr ? formatRelativeTime(rawDateStr, 'ar') : (ord.time || ord.date || '');

        const itemImg =
          ord.items?.[0]?.image ||
          products.find((p) => p.id === ord.items?.[0]?.id)?.image ||
          products[0]?.image ||
          '';

        activities.push({
          id: `ord-${ord.id || cleanNum}`,
          type: 'order',
          userName: cName,
          actionMainEn: 'placed a new order',
          actionMainAr: 'قام بتقديم طلب جديد',
          subEn: timeAgoEn ? `${cleanNum}  ${timeAgoEn}` : cleanNum,
          subAr: timeAgoAr ? `${cleanNum}  ${timeAgoAr}` : cleanNum,
          image: itemImg,
          isAvatar: false,
          timestampMs: getTimestampMs(rawDateStr),
        });
      });
    }

    // 2. Real customer registrations (only when real registeredDate is recorded)
    if (Array.isArray(customers) && customers.length > 0) {
      customers.forEach((cust) => {
        if (!cust.registeredDate) return;
        const cName = getCustomerDisplayName(cust.name, locale) || (isAr ? 'عميل جديد' : 'New Customer');
        const timeAgoEn = formatRelativeTime(cust.registeredDate, 'en');
        const timeAgoAr = formatRelativeTime(cust.registeredDate, 'ar');

        activities.push({
          id: `cust-reg-${cust.id}`,
          type: 'register',
          userName: cName,
          actionMainEn: 'registered',
          actionMainAr: 'سجل في المتجر',
          subEn: `as a new customer  ${timeAgoEn}`,
          subAr: `كعميل جديد  ${timeAgoAr}`,
          image: cust.avatar || '',
          isAvatar: true,
          timestampMs: getTimestampMs(cust.registeredDate),
        });
      });
    }

    // Sort strictly newest to oldest
    activities.sort((a, b) => b.timestampMs - a.timestampMs);
    return activities.slice(0, 5);
  }, [orders, customers, products, locale, isAr]);

  const renderIcon = (type: string) => {
    switch (type) {
      case 'order':
        return (
          <div className="w-10 h-10 rounded-full bg-[#e6f7f5] text-[#007f8c] dark:bg-teal-950/80 dark:text-teal-300 flex items-center justify-center shrink-0">
            <ShoppingCart className="w-5 h-5" />
          </div>
        );
      case 'whatsapp':
        return (
          <div className="w-10 h-10 rounded-full bg-[#e8faf0] text-[#10b981] dark:bg-emerald-950/80 dark:text-emerald-300 flex items-center justify-center shrink-0">
            <MessageCircle className="w-5 h-5" />
          </div>
        );
      case 'register':
        return (
          <div className="w-10 h-10 rounded-full bg-[#e8f7fa] text-[#0284c7] dark:bg-sky-950/80 dark:text-sky-300 flex items-center justify-center shrink-0">
            <User className="w-5 h-5" />
          </div>
        );
      case 'review':
        return (
          <div className="w-10 h-10 rounded-full bg-[#fef7e7] text-[#f59e0b] dark:bg-amber-950/80 dark:text-amber-300 flex items-center justify-center shrink-0">
            <Star className="w-5 h-5" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
        );
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
      {/* ── Card Header ── */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#e6f4f1] dark:bg-teal-950/60 text-[#006d77] dark:text-teal-300 flex items-center justify-center border border-teal-200/50 dark:border-teal-800/40">
            <Activity className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
            {isAr ? 'النشاط الأخير' : 'Recent Activity'}
          </h3>
        </div>

        <button
          type="button"
          onClick={onViewAll}
          className="text-xs font-bold text-[#006d77] hover:text-[#004d5a] dark:text-teal-300 flex items-center gap-1 hover:underline cursor-pointer"
        >
          <span>{isAr ? 'عرض الكل' : 'View All'}</span>
          <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
        </button>
      </div>

      {/* ── Activity Items List or Real Empty State ── */}
      {displayActivities.length === 0 ? (
        <div className="py-10 px-4 text-center flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-[#006d77] dark:text-teal-300 flex items-center justify-center border border-teal-200/50 dark:border-teal-800/40 mb-3">
            <Activity className="w-5 h-5 text-slate-400 dark:text-slate-500" />
          </div>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {isAr ? 'لا يوجد نشاط حديث' : 'No recent activity'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[240px]">
            {isAr ? 'ستظهر هنا طلبات المتجر وتسجيلات العملاء فور حدوثها' : 'New store orders and registrations will appear here'}
          </p>
        </div>
      ) : (
        <div className="space-y-4 pt-1">
          {displayActivities.map((act) => {
            const hasValidImage = !!act.image && !imageErrors[act.id];

            return (
              <div
                key={act.id}
                onClick={() => onNavigateOrder?.(act.id)}
                className="flex items-center justify-between gap-3 group hover:bg-slate-50 dark:hover:bg-slate-800/40 p-1.5 rounded-2xl transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {renderIcon(act.type)}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs leading-snug">
                      <span className="font-black text-slate-950 dark:text-white">
                        {act.userName}{' '}
                      </span>
                      <span className="text-slate-800 dark:text-slate-200 font-semibold">
                        {isAr ? act.actionMainAr : act.actionMainEn}
                      </span>
                    </p>
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mt-0.5">
                      {isAr ? act.subAr : act.subEn}
                    </span>
                  </div>
                </div>

                {/* Thumbnail or Avatar on Right */}
                <div className="shrink-0">
                  {hasValidImage ? (
                    <img
                      src={act.image}
                      alt={act.userName}
                      onError={() => setImageErrors((prev) => ({ ...prev, [act.id]: true }))}
                      className={`w-10 h-10 object-cover border border-slate-200 dark:border-slate-700 shadow-2xs ${
                        act.isAvatar ? 'rounded-full' : 'rounded-2xl'
                      }`}
                    />
                  ) : act.isAvatar ? (
                    <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 flex items-center justify-center font-bold text-xs">
                      {act.userName.charAt(0) || <User className="w-4 h-4" />}
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-[#006d77] dark:text-teal-300 border border-teal-200/50 dark:border-teal-800/40 flex items-center justify-center">
                      <Package className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

RecentActivityCard.displayName = 'RecentActivityCard';
