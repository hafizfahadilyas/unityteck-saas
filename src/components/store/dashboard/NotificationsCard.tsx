import React from 'react';
import {
  Bell,
  ChevronRight,
  ShoppingCart,
  Percent,
  Tag,
  MessageCircle,
  Coins,
  Package,
  AlertTriangle,
} from 'lucide-react';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useNotifications } from '../../../notification-system';
import { NotificationItem } from '../../../notification-system/types/notification.types';
import { WhatsAppService } from '../../../notification-system/services/whatsappService';

interface SmartNotificationDisplayItem {
  id: string;
  type: 'cart' | 'offer' | 'coupon' | 'loyalty' | 'cashback' | 'social' | 'order' | 'warning';
  category: string;
  categoryAr?: string;
  tone: 'pink' | 'orange' | 'green' | 'purple' | 'blue';
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  actionType: 'whatsapp' | 'order' | 'details';
  phone?: string;
  orderId?: string;
  rawItem?: NotificationItem;
}

interface NotificationsCardProps {
  count?: number;
  notifications?: NotificationItem[];
  onViewAll: () => void;
  onOpenOrder?: (orderId: string) => void;
  onOpenWhatsApp?: (phone?: string, text?: string) => void;
  onNavigateTab?: (tab: string) => void;
}

const NotificationsCardInner: React.FC<NotificationsCardProps> = ({
  count,
  notifications: propNotifications,
  onViewAll,
  onOpenOrder,
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
        let tone: SmartNotificationDisplayItem['tone'] = 'blue';

        if (cat.includes('cart') || cat.includes('payment') || sev === 'critical') {
          type = 'cart';
          tone = 'pink';
        } else if (cat.includes('offer') || cat.includes('warning') || sev === 'warning' || cat.includes('stock')) {
          type = 'offer';
          tone = 'orange';
        } else if (cat.includes('coupon')) {
          type = 'coupon';
          tone = 'pink';
        } else if (cat.includes('loyalty') || cat.includes('point')) {
          type = 'loyalty';
          tone = 'green';
        } else if (cat.includes('cashback')) {
          type = 'cashback';
          tone = 'purple';
        } else if (cat.includes('social') || cat.includes('instagram')) {
          type = 'social';
          tone = 'blue';
        } else if (cat.includes('order')) {
          type = 'order';
          tone = 'blue';
        }

        const isWhatsApp =
          item.actionType === 'whatsapp' ||
          item.category === 'Abandoned Cart' ||
          item.whatsappEligible;

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
          actionType: isWhatsApp ? 'whatsapp' : item.destination === 'orders' ? 'order' : 'details',
          phone: item.metadata?.customerPhone || item.customer?.phone,
          orderId: item.metadata?.orderNumber || item.metadata?.orderId || item.id,
          rawItem: item,
        };
      });
    }
    return [];
  }, [sourceNotifications, isAr]);

  const displayCount = count !== undefined ? count : (unreadCounts.total ?? displayItems.length);

  const getContainerStyle = (tone: string) => {
    switch (tone) {
      case 'pink':
        return 'bg-[#fff5f6] dark:bg-rose-950/20 border-[#fed7dc] dark:border-rose-900/40';
      case 'orange':
        return 'bg-[#fffbf0] dark:bg-amber-950/20 border-[#feecdc] dark:border-amber-900/40';
      case 'green':
        return 'bg-[#f0fdf4] dark:bg-emerald-950/20 border-[#bbf7d0] dark:border-emerald-900/40';
      case 'purple':
        return 'bg-[#faf5ff] dark:bg-purple-950/20 border-[#e9d5ff] dark:border-purple-900/40';
      case 'blue':
      default:
        return 'bg-[#f0f9ff] dark:bg-sky-950/20 border-[#bae6fd] dark:border-sky-900/40';
    }
  };

  const getBadgeStyle = (tone: string) => {
    switch (tone) {
      case 'pink':
        return 'bg-[#fde2e4] text-[#e11d48] border-[#fecdd3] dark:bg-rose-950 dark:text-rose-300';
      case 'orange':
        return 'bg-[#fef3c7] text-[#d97706] border-[#fde68a] dark:bg-amber-950 dark:text-amber-300';
      case 'green':
        return 'bg-[#dcfce7] text-[#16a34a] border-[#bbf7d0] dark:bg-emerald-950 dark:text-emerald-300';
      case 'purple':
        return 'bg-[#f3e8ff] text-[#9333ea] border-[#e9d5ff] dark:bg-purple-950 dark:text-purple-300';
      case 'blue':
      default:
        return 'bg-[#e0f2fe] text-[#0284c7] border-[#bae6fd] dark:bg-sky-950 dark:text-sky-300';
    }
  };

  const renderItemIcon = (type: SmartNotificationDisplayItem['type']) => {
    switch (type) {
      case 'cart':
        return (
          <div className="w-8 h-8 rounded-lg bg-[#ffe4e6] text-[#e11d48] dark:bg-rose-950/60 flex items-center justify-center shrink-0">
            <ShoppingCart className="w-4 h-4" />
          </div>
        );
      case 'offer':
        return (
          <div className="w-8 h-8 rounded-lg bg-[#fef3c7] text-[#d97706] dark:bg-amber-950/60 flex items-center justify-center shrink-0">
            <Percent className="w-4 h-4" />
          </div>
        );
      case 'coupon':
        return (
          <div className="w-8 h-8 rounded-lg bg-[#ffe4e6] text-[#e11d48] dark:bg-rose-950/60 flex items-center justify-center shrink-0">
            <Tag className="w-4 h-4" />
          </div>
        );
      case 'loyalty':
        return (
          <div className="w-8 h-8 rounded-lg bg-[#dcfce7] text-[#16a34a] dark:bg-emerald-950/60 flex items-center justify-center shrink-0">
            <Coins className="w-4 h-4" />
          </div>
        );
      case 'cashback':
        return (
          <div className="w-8 h-8 rounded-lg bg-[#f3e8ff] text-[#9333ea] dark:bg-purple-950/60 flex items-center justify-center shrink-0">
            <Coins className="w-4 h-4" />
          </div>
        );
      case 'social':
        return (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 text-white flex items-center justify-center shrink-0 font-black text-[10px] shadow-2xs">
            IG
          </div>
        );
      case 'order':
        return (
          <div className="w-8 h-8 rounded-lg bg-[#fed7aa] text-[#c2410c] dark:bg-orange-950/60 flex items-center justify-center shrink-0">
            <Package className="w-4 h-4" />
          </div>
        );
      case 'warning':
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-[#fef3c7] text-[#d97706] dark:bg-amber-950/60 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
        );
    }
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

    if (item.actionType === 'order') {
      if (onOpenOrder) {
        onOpenOrder(item.orderId || 'latest');
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
    <div className="@container p-3.5 sm:p-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
      {/* ── Card Header ── */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800 mb-2.5">
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

      {/* ── Notification Items List or Real Empty State ── */}
      {displayItems.length === 0 ? (
        <div className="py-8 px-4 text-center flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-[#006d77] dark:text-teal-300 flex items-center justify-center border border-teal-200/50 dark:border-teal-800/40 mb-2.5">
            <Bell className="w-5 h-5 text-slate-400 dark:text-slate-500" />
          </div>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {isAr ? 'لا توجد إشعارات جديدة' : 'No new notifications'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[220px]">
            {isAr ? 'ستصلك هنا تنبيهات المتجر والطلبات فور حدوثها' : 'Important store alerts and order updates will appear here'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {displayItems.map((item) => (
            <div
              key={item.id}
              className={`p-2.5 sm:p-3 rounded-xl border transition-all flex flex-col @[480px]:flex-row @[480px]:items-center justify-between gap-2.5 ${getContainerStyle(
                item.tone
              )}`}
            >
              {/* Upper / Left Block: Icon + Content taking full width without squishing */}
              <div className="flex items-start gap-2.5 min-w-0 w-full @[480px]:w-auto flex-1">
                {renderItemIcon(item.type)}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="text-xs font-black text-slate-950 dark:text-white leading-snug">
                      {isAr ? item.titleAr : item.titleEn}
                    </h4>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${getBadgeStyle(
                        item.tone
                      )}`}
                    >
                      {isAr ? (item.categoryAr || item.category) : item.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-800 dark:text-slate-200 mt-1 leading-relaxed font-semibold break-words">
                    {isAr ? item.descAr : item.descEn}
                  </p>
                </div>
              </div>

              {/* Action Button: Adapts seamlessly — full width/neat end alignment on compact container, centered on wide container */}
              <div className="shrink-0 flex items-center justify-end @[480px]:self-center pt-2 @[480px]:pt-0 border-t @[480px]:border-t-0 border-black/5 dark:border-white/5">
                {item.actionType === 'whatsapp' ? (
                  <button
                    type="button"
                    onClick={() => handleAction(item)}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white transition-all active:scale-95 shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap bg-[#00a884] hover:bg-[#008f70]"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-current" />
                    <span>{isAr ? 'مراسلة عبر واتساب' : 'Message on WhatsApp'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleAction(item)}
                    className="px-3.5 py-1.5 rounded-lg text-[11px] font-bold text-white transition-all active:scale-95 shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap bg-[#0066ff] hover:bg-[#0052cc]"
                  >
                    <span>{isAr ? 'عرض الطلب' : 'View Order'}</span>
                    <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </button>
                )}
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
