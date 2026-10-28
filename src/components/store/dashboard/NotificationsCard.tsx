import React from 'react';
import {
  Bell,
  ChevronRight,
  ShoppingCart,
  Percent,
  Tag,
  Coins,
  Package,
  AlertTriangle,
} from 'lucide-react';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useNotifications } from '../../../notification-system';
import { NotificationItem } from '../../../notification-system/types/notification.types';
import { WhatsAppService } from '../../../notification-system/services/whatsappService';
import { WhatsAppBrandIcon } from '../../common/BrandIcons';

interface SmartNotificationDisplayItem {
  id: string;
  type: 'cart' | 'offer' | 'coupon' | 'loyalty' | 'cashback' | 'social' | 'order' | 'warning' | 'critical';
  category: string;
  categoryAr?: string;
  tone: 'red' | 'pink' | 'orange' | 'green' | 'purple' | 'blue';
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  actionType: 'whatsapp' | 'order' | 'product' | 'details';
  phone?: string;
  orderId?: string;
  productId?: string;
  rawItem?: NotificationItem;
}

interface NotificationsCardProps {
  count?: number;
  notifications?: NotificationItem[];
  onViewAll: () => void;
  onOpenOrder?: (orderId: string) => void;
  onOpenProduct?: (productId: string) => void;
  onOpenWhatsApp?: (phone?: string, text?: string) => void;
  onNavigateTab?: (tab: string) => void;
}

const NotificationsCardInner: React.FC<NotificationsCardProps> = ({
  count,
  notifications: propNotifications,
  onViewAll,
  onOpenOrder,
  onOpenProduct,
  onOpenWhatsApp,
  onNavigateTab,
}) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';

  const {
    notifications: liveNotifications,
    unreadCounts,
    handleAction: dispatchAction,
  } = useNotifications();

  // Convert live real notifications from notification system (zero fake/dummy fallback)
  const sourceNotifications = propNotifications || liveNotifications;

  const displayItems: SmartNotificationDisplayItem[] = React.useMemo(() => {
    if (sourceNotifications && sourceNotifications.length > 0) {
      return sourceNotifications.slice(0, 7).map((item): SmartNotificationDisplayItem => {
        const cat = item.category?.toLowerCase() || '';
        const sev = item.severity?.toLowerCase() || '';

        let type: SmartNotificationDisplayItem['type'] = 'warning';
        let tone: SmartNotificationDisplayItem['tone'] = 'orange';

        // Strict Level of Importance: RED reserved exclusively for critical issues
        if (sev === 'critical' || cat.includes('out of stock') || cat.includes('out_of_stock')) {
          type = 'critical';
          tone = 'red';
        } else if (cat.includes('coupon')) {
          type = 'coupon';
          tone = 'pink';
        } else if (cat.includes('cart') || cat.includes('abandoned')) {
          type = 'cart';
          tone = 'orange';
        } else if (cat.includes('seo') || cat.includes('performance') || cat.includes('impression')) {
          type = 'offer';
          tone = 'orange';
        } else if (cat.includes('shipping') || cat.includes('delivery')) {
          type = 'offer';
          tone = 'orange';
        } else if (cat.includes('special offer') || cat.includes('vip')) {
          type = 'offer';
          tone = 'orange';
        } else if (cat.includes('google ads') || cat.includes('ads')) {
          type = 'offer';
          tone = 'orange';
        } else if (cat.includes('loyalty') || cat.includes('point')) {
          type = 'loyalty';
          tone = 'green';
        } else if (cat.includes('cashback')) {
          type = 'cashback';
          tone = 'purple';
        } else if (cat.includes('order')) {
          type = 'order';
          tone = 'orange';
        }

        const isWhatsApp =
          item.actionType === 'whatsapp' ||
          item.category === 'Abandoned Cart' ||
          item.whatsappEligible;

        const isProductNav =
          item.destination === 'products' ||
          item.actionType === 'product' ||
          item.registryCode === 'product_low_impressions';

        return {
          id: item.id,
          type,
          category: item.category,
          categoryAr: (item as any).categoryAr || item.category,
          tone,
          titleEn: item.title,
          titleAr: item.titleAr || item.title,
          descEn: item.description,
          descAr: item.descriptionAr || item.description,
          actionType: isWhatsApp ? 'whatsapp' : isProductNav ? 'product' : item.destination === 'orders' ? 'order' : 'details',
          phone: item.metadata?.customerPhone || item.customer?.phone,
          orderId: item.metadata?.orderNumber || item.metadata?.orderId || item.id,
          productId: item.metadata?.productId || (item as any).productId,
          rawItem: item,
        };
      });
    }
    return [];
  }, [sourceNotifications, isAr]);

  const displayCount = count !== undefined ? count : (unreadCounts.total ?? displayItems.length);

  const getContainerStyle = (tone: string) => {
    switch (tone) {
      case 'red':
        return 'bg-[#fff1f2] dark:bg-[#251317] border-rose-300 dark:border-rose-900/60 shadow-xs';
      case 'pink':
        return 'bg-[#fff5f6] dark:bg-[#1f1618] border-[#fed7dc] dark:border-rose-900/40 shadow-xs';
      case 'orange':
      default:
        return 'bg-[#fffbf0] dark:bg-[#1e1c17] border-[#feecdc] dark:border-amber-900/40 shadow-xs';
    }
  };

  const getBadgeStyle = (tone: string) => {
    switch (tone) {
      case 'red':
        return 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/80 dark:text-rose-200 dark:border-rose-800 font-bold';
      case 'pink':
        return 'bg-[#fde2e4] text-[#e11d48] border-[#fecdd3] dark:bg-rose-950 dark:text-rose-300 dark:border-rose-900/60';
      case 'orange':
      default:
        return 'bg-[#fef3c7] text-[#d97706] border-[#fde68a] dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-900/60';
    }
  };

  const renderItemIcon = (item: SmartNotificationDisplayItem) => {
    if (item.type === 'critical') {
      return (
        <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-900/60 shadow-2xs">
          <AlertTriangle className="w-5 h-5" />
        </div>
      );
    }
    if (item.type === 'cart' || item.category.toLowerCase().includes('abandoned')) {
      return (
        <div className="w-10 h-10 rounded-xl bg-[#ffe4e6] text-[#e11d48] dark:bg-rose-950/60 dark:text-rose-400 flex items-center justify-center shrink-0 border border-[#fecdd3]/60 dark:border-rose-900/40 shadow-2xs">
          <ShoppingCart className="w-5 h-5" />
        </div>
      );
    }
    if (item.type === 'coupon' || item.category.toLowerCase().includes('coupon')) {
      return (
        <div className="w-10 h-10 rounded-xl bg-[#ffe4e6] text-[#e11d48] dark:bg-rose-950/60 dark:text-rose-400 flex items-center justify-center shrink-0 border border-[#fecdd3]/60 dark:border-rose-900/40 shadow-2xs">
          <Tag className="w-5 h-5" />
        </div>
      );
    }
    // Default for Shipping & Delivery, SEO & Performance, Special Offer, Google Ads
    return (
      <div className="w-10 h-10 rounded-xl bg-[#fef3c7] text-[#d97706] dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center shrink-0 border border-[#fde68a]/60 dark:border-amber-900/40 shadow-2xs font-bold text-base select-none">
        <Percent className="w-5 h-5 stroke-[2.5]" />
      </div>
    );
  };

  const handleAction = (item: SmartNotificationDisplayItem) => {
    if (item.actionType === 'whatsapp') {
      const targetPhone = item.phone || '+966500000001';
      const targetText = isAr ? item.descAr : item.descEn;

      if (onOpenWhatsApp) {
        onOpenWhatsApp(targetPhone, targetText);
      } else {
        WhatsAppService.openWhatsApp(
          {
            phoneNumber: targetPhone,
            customMessage: targetText,
          },
          isAr
        );
      }
      return;
    }

    if (item.actionType === 'product') {
      const prodId = item.productId;
      if (prodId) {
        try {
          sessionStorage.setItem('target_edit_product_id', prodId);
        } catch {}
      }
      if (onOpenProduct && prodId) {
        onOpenProduct(prodId);
      } else if (onNavigateTab) {
        onNavigateTab('products');
      }
      return;
    }

    if (item.actionType === 'order') {
      const orderId = item.orderId || 'latest';
      try {
        sessionStorage.setItem('target_view_order_id', orderId);
      } catch {}
      if (onOpenOrder) {
        onOpenOrder(orderId);
      } else if (onNavigateTab) {
        onNavigateTab('orders');
      }
      return;
    }

    if (item.rawItem && dispatchAction) {
      dispatchAction(item.rawItem, onNavigateTab);
    } else if (onNavigateTab) {
      onNavigateTab('notifications');
    }
  };

  return (
    <div className="@container p-3.5 sm:p-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs flex flex-col h-full min-h-[260px] max-h-[320px]">
      {/* ── Card Header ── */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800 mb-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#e6f4f1] dark:bg-teal-950/60 text-[#006d77] dark:text-teal-300 flex items-center justify-center border border-teal-200/50 dark:border-teal-800/40">
            <Bell className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-slate-950 dark:text-white leading-tight">
              {isAr ? 'الإشعارات' : 'Notifications'}
            </h3>
            <span className="min-w-5 h-5 px-1.5 rounded-full bg-[#ef4444] text-white font-black text-[10px] flex items-center justify-center shadow-2xs">
              {displayCount}
            </span>
          </div>
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

      {/* ── Scrollable live notifications (height matched to Top Products / Traffic) ── */}
      {displayItems.length === 0 ? (
        <div className="flex-1 py-6 px-3 text-center flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-2 border border-slate-200 dark:border-slate-700">
            <Bell className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {isAr ? 'لا توجد سجلات' : 'No records found'}
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 max-w-[200px]">
            {isAr ? 'ستظهر هنا الإشعارات المباشرة فور حدوثها' : 'Live store alerts will appear here'}
          </p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-2.5 pe-0.5 [scrollbar-width:thin]">
          {displayItems.map((item) => (
            <div
              key={item.id}
              className={`p-3 sm:p-3.5 rounded-2xl border transition-all ${getContainerStyle(
                item.tone
              )}`}
            >
              {/* Upper Section: Icon + Title + Badge + Description + Action */}
              <div className="flex items-start gap-3">
                {renderItemIcon(item)}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm sm:text-[15px] font-black text-slate-900 dark:text-white leading-snug">
                    {isAr ? item.titleAr : item.titleEn}
                  </h4>

                  {/* Category Badge on its own line directly below title */}
                  <div className="mt-1.5 mb-1.5">
                    <span
                      className={`inline-flex items-center text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getBadgeStyle(
                        item.tone
                      )}`}
                    >
                      {isAr ? (item.categoryAr || item.category) : item.category}
                    </span>
                  </div>

                  {/* Description + compact action button side by side */}
                  <div className="flex items-end gap-2 justify-between">
                    <p className="text-xs sm:text-[13px] text-slate-800 dark:text-slate-200 font-medium leading-relaxed break-words min-w-0 flex-1">
                      {isAr ? item.descAr : item.descEn}
                    </p>
                    {item.actionType === 'whatsapp' ? (
                      <button
                        type="button"
                        onClick={() => handleAction(item)}
                        className="shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white transition-all active:scale-95 shadow-xs flex items-center gap-1 cursor-pointer whitespace-nowrap bg-[#00a884] hover:bg-[#008f70]"
                      >
                        <WhatsAppBrandIcon className="w-3 h-3" title="WhatsApp" />
                        <span>{isAr ? 'واتساب' : 'WhatsApp'}</span>
                      </button>
                    ) : item.actionType === 'product' ? (
                      <button
                        type="button"
                        onClick={() => handleAction(item)}
                        className="shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white transition-all active:scale-95 shadow-xs flex items-center gap-0.5 cursor-pointer whitespace-nowrap bg-[#00897b] hover:bg-[#00796b]"
                      >
                        <span>{isAr ? 'فتح المنتج' : 'Open Product'}</span>
                        <ChevronRight className="w-3 h-3 rtl:rotate-180" />
                      </button>
                    ) : item.type === 'critical' ? (
                      <button
                        type="button"
                        onClick={() => handleAction(item)}
                        className="shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white transition-all active:scale-95 shadow-xs flex items-center gap-0.5 cursor-pointer whitespace-nowrap bg-rose-600 hover:bg-rose-700"
                      >
                        <span>{isAr ? 'معالجة' : 'Resolve'}</span>
                        <ChevronRight className="w-3 h-3 rtl:rotate-180" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAction(item)}
                        className="shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white transition-all active:scale-95 shadow-xs flex items-center gap-0.5 cursor-pointer whitespace-nowrap bg-[#0066ff] hover:bg-[#0052cc]"
                      >
                        <span>{isAr ? 'عرض الطلب' : 'View Order'}</span>
                        <ChevronRight className="w-3 h-3 rtl:rotate-180" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const NotificationsCard = React.memo(NotificationsCardInner);
NotificationsCard.displayName = 'NotificationsCard';
