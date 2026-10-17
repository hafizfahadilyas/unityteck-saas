import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { NotificationItem, NotificationZone } from '../types/notification.types';
import { NotificationEngine } from '../services/notificationEngine';
import { notificationAPI } from '../services/notificationAPI';
import { WhatsAppService } from '../services/whatsappService';
import { useRealtimeSync } from './useRealtimeSync';
import { usePrefs } from '../../i18n/PrefsContext';

const DISMISSED_KEY = 'souq_dismissed_notifications';
const READ_KEY = 'souq_read_notifications';
const SNOOZED_KEY = 'souq_snoozed_notifications';

function getStoredSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveStoredSet(key: string, set: Set<string>): void {
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.warn(`Failed to save ${key}`, e);
  }
}

function getSnoozedMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(SNOOZED_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveSnoozedMap(map: Record<string, string>): void {
  try {
    localStorage.setItem(SNOOZED_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn(`Failed to save ${SNOOZED_KEY}`, e);
  }
}

export function useNotifications() {
  const { activeStore, currentOrders, currentProducts, currentCustomers, currentCoupons } = useTenant();
  const { locale } = usePrefs();
  const isAr = locale === 'ar';

  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => getStoredSet(DISMISSED_KEY));
  const [readIds, setReadIds] = useState<Set<string>>(() => getStoredSet(READ_KEY));
  const [snoozedMap, setSnoozedMap] = useState<Record<string, string>>(() => getSnoozedMap());
  const [rawItems, setRawItems] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync engine computation
  const computeNotifications = useCallback(() => {
    try {
      const generated = NotificationEngine.generateNotifications({
        activeStore,
        currentOrders,
        currentProducts,
        currentCustomers,
        currentCoupons,
      });
      setRawItems(generated);
      notificationAPI.saveToCache(generated);
    } finally {
      setIsLoading(false);
    }
  }, [activeStore, currentOrders, currentProducts, currentCustomers, currentCoupons]);

  useEffect(() => {
    computeNotifications();
  }, [computeNotifications]);

  // Realtime background sync every 30s
  useRealtimeSync(computeNotifications, 30000);

  // Filter out dismissed and currently snoozed notifications
  const activeNotifications = useMemo(() => {
    const now = Date.now();
    return rawItems
      .filter((item) => {
        if (dismissedIds.has(item.id)) return false;
        const snoozedUntilStr = snoozedMap[item.id];
        if (snoozedUntilStr) {
          const snoozedUntil = new Date(snoozedUntilStr).getTime();
          if (now < snoozedUntil) return false;
        }
        return true;
      })
      .map((item) => ({
        ...item,
        read: readIds.has(item.id) || item.read,
      }));
  }, [rawItems, dismissedIds, readIds, snoozedMap]);

  // Partition by zones
  const zone1Items = useMemo(
    () => activeNotifications.filter((item) => item.zone === 'zone1_issues'),
    [activeNotifications],
  );

  const zone2Items = useMemo(
    () => activeNotifications.filter((item) => item.zone === 'zone2_marketing'),
    [activeNotifications],
  );

  const zone3Items = useMemo(
    () => activeNotifications.filter((item) => item.zone === 'zone3_urgent'),
    [activeNotifications],
  );

  // Unread counts
  const unreadCounts = useMemo(() => {
    const countZone1 = zone1Items.filter((i) => !i.read).length;
    const countZone2 = zone2Items.filter((i) => !i.read).length;
    const countZone3 = zone3Items.filter((i) => !i.read).length;
    return {
      zone1: countZone1,
      zone2: countZone2,
      zone3: countZone3,
      total: countZone1 + countZone2 + countZone3,
    };
  }, [zone1Items, zone2Items, zone3Items]);

  // Mark as read (optimistic)
  const markAsRead = useCallback((id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveStoredSet(READ_KEY, next);
      return next;
    });
    void notificationAPI.markAsRead(id);
  }, []);

  // Mark all as read (optimistic)
  const markAllAsRead = useCallback(
    (zone?: NotificationZone) => {
      setReadIds((prev) => {
        const next = new Set(prev);
        const targetItems = zone
          ? activeNotifications.filter((i) => i.zone === zone)
          : activeNotifications;
        targetItems.forEach((i) => next.add(i.id));
        saveStoredSet(READ_KEY, next);
        return next;
      });
      void notificationAPI.markAllAsRead();
    },
    [activeNotifications],
  );

  // Dismiss notification (optimistic)
  const dismissNotification = useCallback((id: string) => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveStoredSet(DISMISSED_KEY, next);
      return next;
    });
    void notificationAPI.dismissNotification(id);
  }, []);

  // Snooze notification
  const snoozeNotification = useCallback((id: string, snoozeMinutes = 60) => {
    const snoozedUntil = new Date(Date.now() + snoozeMinutes * 60 * 1000).toISOString();
    setSnoozedMap((prev) => {
      const next = { ...prev, [id]: snoozedUntil };
      saveSnoozedMap(next);
      return next;
    });
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveStoredSet(READ_KEY, next);
      return next;
    });
    void notificationAPI.snoozeNotification(id, snoozeMinutes);
  }, []);

  // Action dispatcher
  const handleAction = useCallback(
    (item: NotificationItem, onNavigateTab?: (tab: string) => void) => {
      markAsRead(item.id);

      if (item.actionType === 'whatsapp' || item.category === 'Abandoned Cart') {
        const opened = WhatsAppService.openWhatsApp(
          {
            phoneNumber: item.metadata?.customerPhone || '0559123456',
            customerName: item.metadata?.customerName || (isAr ? 'عميلنا العزيز' : 'Valued Customer'),
            orderNumber: item.metadata?.orderNumber,
            amount: item.metadata?.amount,
            discountCode: item.metadata?.discountCode || 'GIFT10',
            productName: item.metadata?.productName,
            checkoutUrl: item.metadata?.checkoutUrl,
          },
          isAr,
        );
        if (opened) return;
      }

      // Default navigate
      if (onNavigateTab && item.destination) {
        onNavigateTab(item.destination);
      }
    },
    [markAsRead, isAr],
  );

  return {
    notifications: activeNotifications,
    zone1Items,
    zone2Items,
    zone3Items,
    unreadCounts,
    isLoading,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    snoozeNotification,
    handleAction,
    refresh: computeNotifications,
  };
}
