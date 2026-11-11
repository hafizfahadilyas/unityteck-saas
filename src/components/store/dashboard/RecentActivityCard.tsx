import React, { useState } from 'react';
import { Activity, ChevronRight, ShoppingCart, MessageCircle, User, Star, Package, ShoppingBag } from 'lucide-react';
import { usePrefs } from '../../../i18n/PrefsContext';
import { Order, Customer, Product } from '../../../types';
import { getCustomerDisplayName } from '../../../utils/storeLocalization';
import { formatRelativeTime } from '../../../notification-system/utils/dateFilters';
import { formatOrderRef } from '../../../utils/orderDisplay';
import type { CustomerActivityRow } from '../../../api/tenantApi';

function asStringMeta(value: unknown): string {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

interface ActivityItem {
  id: string;
  type: 'order' | 'whatsapp' | 'register' | 'review' | 'cart' | 'abandoned' | 'checkout';
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
  /** Public storefront activities (add_to_cart, checkout_started, …) — never admin */
  storefrontActivities?: CustomerActivityRow[];
  onViewAll: () => void;
  onNavigateOrder?: (orderId: string) => void;
}

export const RecentActivityCard: React.FC<RecentActivityCardProps> = React.memo(({
  orders = [],
  customers = [],
  products = [],
  storefrontActivities = [],
  onViewAll,
  onNavigateOrder,
}) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const getTimestampMs = (val?: string): number => {
    if (!val) return 0;
    try {
      const parsed = Date.parse(val.includes(' ') ? val.replace(' ', 'T') : val);
      return isNaN(parsed) ? 0 : parsed;
    } catch {
      return 0;
    }
  };

  const displayActivities = React.useMemo<ActivityItem[]>(() => {
    const activities: ActivityItem[] = [];

    // 1. Real completed / processing orders (not abandoned carts)
    if (Array.isArray(orders) && orders.length > 0) {
      orders.forEach((ord) => {
        const st = String(ord.status || '').toLowerCase();
        if (st === 'draft' || st === 'abandoned') return;
        const pay = String(ord.paymentStatus || '').toLowerCase();
        if (st === 'pending' && (pay === 'unpaid' || pay === 'pending' || pay === '')) {
          // Incomplete checkout → abandoned section only
          return;
        }
        const cleanNum = formatOrderRef(ord.orderNumber, ord.id);
        const cName = getCustomerDisplayName(ord.customerName, locale) || (isAr ? 'عميل' : 'Customer');
        const rawDateStr =
          ord.createdAt ||
          (ord.date && ord.time ? `${ord.date}T${ord.time}` : ord.date) ||
          ord.paymentDate;
        const timeAgoEn = rawDateStr ? formatRelativeTime(rawDateStr, 'en') : (ord.time || ord.date || '');
        const timeAgoAr = rawDateStr ? formatRelativeTime(rawDateStr, 'ar') : (ord.time || ord.date || '');
        // Real item image only — never borrow another product as a fake avatar.
        const itemImg =
          ord.items?.[0]?.image ||
          products.find((p) => p.id === ord.items?.[0]?.id)?.image ||
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

    // 2. Public storefront funnel: add_to_cart / checkout / abandoned
    if (Array.isArray(storefrontActivities) && storefrontActivities.length > 0) {
      storefrontActivities.forEach((row) => {
        const type = String(row.activity_type || '').toLowerCase();
        if (!type || type === 'product_viewed' || type === 'payment_completed') return;

        const when = row.occurred_at || '';
        const timeEn = when ? formatRelativeTime(when, 'en') : '';
        const timeAr = when ? formatRelativeTime(when, 'ar') : '';
        const who =
          (row.customer_name && String(row.customer_name).trim()) ||
          (isAr ? 'زائر' : 'Visitor');
        const productLabel = (row.product_name && String(row.product_name).trim()) || '';
        const metaPid = asStringMeta(row.meta?.product_id) || asStringMeta((row as { product_id?: string }).product_id);
        const productImg = products.find((p) => String(p.id) === metaPid)?.image || '';

        if (type === 'add_to_cart') {
          activities.push({
            id: `sf-cart-${row.id}`,
            type: 'cart',
            userName: who,
            actionMainEn: productLabel ? `added ${productLabel} to cart` : 'added a product to cart',
            actionMainAr: productLabel ? `أضاف ${productLabel} إلى سلة التسوق` : 'أضاف منتجاً إلى سلة التسوق',
            subEn: timeEn || (isAr ? '' : 'Storefront'),
            subAr: timeAr || 'واجهة المتجر',
            image: productImg,
            isAvatar: false,
            timestampMs: getTimestampMs(when),
          });
          return;
        }

        if (type === 'checkout_started') {
          activities.push({
            id: `sf-co-${row.id}`,
            type: 'checkout',
            userName: who,
            actionMainEn: 'started checkout',
            actionMainAr: 'بدأ إتمام الشراء',
            subEn: timeEn,
            subAr: timeAr,
            image: productImg,
            isAvatar: false,
            timestampMs: getTimestampMs(when),
          });
          return;
        }

        if (type === 'remove_from_cart') {
          activities.push({
            id: `sf-rm-${row.id}`,
            type: 'abandoned',
            userName: who,
            actionMainEn: productLabel ? `removed ${productLabel} from cart` : 'removed an item from cart',
            actionMainAr: productLabel ? `أزال ${productLabel} من سلة التسوق` : 'أزال منتجاً من سلة التسوق',
            subEn: timeEn,
            subAr: timeAr,
            image: productImg,
            isAvatar: false,
            timestampMs: getTimestampMs(when),
          });
        }
      });
    }

    // 3. Abandoned carts from incomplete orders (pending / draft / abandoned status)
    if (Array.isArray(orders) && orders.length > 0) {
      const abandonedStatuses = new Set(['pending', 'draft', 'abandoned', 'cancelled', 'unpaid']);
      orders.forEach((ord) => {
        const st = String(ord.status || '').toLowerCase();
        if (!abandonedStatuses.has(st)) return;
        // Paid / completed orders already shown as "placed"
        if (String(ord.paymentStatus || '').toLowerCase() === 'paid') return;
        const cleanNum = formatOrderRef(ord.orderNumber, ord.id);
        const cName = getCustomerDisplayName(ord.customerName, locale) || (isAr ? 'عميل' : 'Customer');
        const rawDateStr = ord.createdAt || ord.date || '';
        // Avoid duplicating the same order row if already listed as order above for pending
        // Show as abandoned cart recovery signal
        activities.push({
          id: `abd-${ord.id || cleanNum}`,
          type: 'abandoned',
          userName: cName,
          actionMainEn: 'left an abandoned cart',
          actionMainAr: 'ترك سلة تسوق متروكة',
          subEn: rawDateStr
            ? `${cleanNum}  ${formatRelativeTime(rawDateStr, 'en')}`
            : cleanNum,
          subAr: rawDateStr
            ? `${cleanNum}  ${formatRelativeTime(rawDateStr, 'ar')}`
            : cleanNum,
          image: ord.items?.[0]?.image || '',
          isAvatar: false,
          timestampMs: getTimestampMs(rawDateStr),
        });
      });
    }

    // 4. Customer registrations — only real API customers for THIS store (recent 60 days)
    if (Array.isArray(customers) && customers.length > 0) {
      const now = Date.now();
      const sixtyDaysMs = 60 * 24 * 60 * 60 * 1000;
      customers.forEach((cust) => {
        if (!cust?.id || !cust.registeredDate) return;
        // Skip legacy demo seed ids if any linger in cache
        if (/^(cust-cof-|cust-blc-|cust-mkk-)/i.test(String(cust.id))) return;
        const ts = getTimestampMs(cust.registeredDate);
        if (!ts || now - ts > sixtyDaysMs) return;
        const cName = getCustomerDisplayName(cust.name, locale) || (isAr ? 'عميل جديد' : 'New Customer');
        activities.push({
          id: `cust-reg-${cust.id}`,
          type: 'register',
          userName: cName,
          actionMainEn: 'registered',
          actionMainAr: 'سجل في المتجر',
          subEn: `as a new customer  ${formatRelativeTime(cust.registeredDate, 'en')}`,
          subAr: `كعميل جديد  ${formatRelativeTime(cust.registeredDate, 'ar')}`,
          image: cust.avatar || '',
          isAvatar: true,
          timestampMs: ts,
        });
      });
    }

    activities.sort((a, b) => b.timestampMs - a.timestampMs);
    // Dedupe abandoned + order for same order id prefer order if paid already handled
    const seen = new Set<string>();
    const deduped: ActivityItem[] = [];
    for (const a of activities) {
      const key = a.id.replace(/^(ord|abd)-/, 'o-');
      if (a.type === 'abandoned' && seen.has(`o-${key.replace(/^o-/, '')}`)) continue;
      if (a.type === 'order') seen.add(key);
      if (seen.has(a.id)) continue;
      seen.add(a.id);
      deduped.push(a);
    }
    return deduped.slice(0, 8);
  }, [orders, customers, products, storefrontActivities, locale, isAr]);

  const renderIcon = (type: string) => {
    switch (type) {
      case 'order':
        return (
          <div className="u-icon-brand w-10 h-10 rounded-full flex items-center justify-center shrink-0">
            <ShoppingCart className="w-5 h-5" />
          </div>
        );
      case 'cart':
        return (
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
        );
      case 'checkout':
        return (
          <div className="w-10 h-10 rounded-full bg-violet-50 text-violet-700 dark:bg-violet-950/80 dark:text-violet-300 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
        );
      case 'abandoned':
        return (
          <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 flex items-center justify-center shrink-0">
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
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: 'color-mix(in srgb, var(--accent) 14%, var(--surface))',
              color: 'var(--accent)',
            }}
          >
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
    <div
      className="u-card p-4 sm:p-5 rounded-2xl shadow-xs flex flex-col h-full min-h-[260px] flex-1"
      style={{ fontFamily: 'var(--font-ui)' }}
    >
      <div className="flex items-center justify-between pb-3 mb-3 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2.5">
          <div className="u-icon-brand w-8 h-8 rounded-xl flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-black leading-tight" style={{ color: 'var(--text)' }}>
            {isAr ? 'النشاط الأخير' : 'Recent Activity'}
          </h3>
        </div>

        <button
          type="button"
          onClick={onViewAll}
          className="u-accent-text text-xs font-bold flex items-center gap-1 hover:underline cursor-pointer"
        >
          <span>{isAr ? 'عرض الكل' : 'View All'}</span>
          <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
        </button>
      </div>

      {displayActivities.length === 0 ? (
        <div className="flex-1 min-h-0 py-10 px-4 text-center flex flex-col items-center justify-center">
          <div className="u-icon-brand w-10 h-10 rounded-2xl flex items-center justify-center mb-3">
            <Activity className="w-5 h-5 opacity-60" />
          </div>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {isAr ? 'لا يوجد نشاط حديث' : 'No recent activity'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[240px]">
            {isAr
              ? 'ستظهر هنا زيارات واجهة المتجر وإضافة السلة والطلبات الحقيقية فقط'
              : 'Real storefront add-to-cart, abandoned carts, and orders appear here'}
          </p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pt-1">
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
                    <div className="u-icon-brand w-10 h-10 rounded-2xl flex items-center justify-center">
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
