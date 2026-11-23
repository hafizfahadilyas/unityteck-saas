import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { hasLiveApiAuth } from '../../auth/session';
import {
  fetchNotificationDeliveriesApi,
  markNotificationDeliveriesReadApi,
} from '../../api/tenantApi';
import { NotificationItem, NotificationZone } from '../types/notification.types';
import { NotificationEngine } from '../services/notificationEngine';
import { notificationAPI } from '../services/notificationAPI';
import { WhatsAppService } from '../services/whatsappService';
import {
  ensureNotificationAudioUnlock,
  inferAlertSoundKind,
  playNotificationSound,
} from '../services/notificationSound';
import { useRealtimeSync } from './useRealtimeSync';
import { usePrefs } from '../../i18n/PrefsContext';

/** Stable business signature — ignores clock-skew timestamps that recompute every poll. */
function soundSignature(item: NotificationItem): string {
  const meta = item.metadata || {};
  return [
    item.id,
    item.aggregatedCount ?? '',
    meta.orderId ?? '',
    meta.orderNumber ?? '',
    meta.count ?? '',
    meta.customerName ?? '',
    meta.customerPhone ?? '',
    item.registryCode ?? '',
  ].join('|');
}

function isAdminDashboardSurface(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase();
  return path.includes('/admin') || path.includes('/master');
}

/** Module singletons — safe if multiple hook instances mount before NotificationsProvider. */
let sharedSeenSoundKeys: Set<string> | null = null;
let sharedSoundStoreId: string | null = null;
let commercePollTimer: number | null = null;
let commercePollListeners = 0;
let commercePollInFlight = false;
let lastCommercePollAt = 0;

const DELIVERY_ID_PREFIX = 'delivery-';

function mapDeliveryRowToNotification(row: Record<string, unknown>): NotificationItem {
  const id = String(row.id ?? '');
  const channel = String(row.channel ?? 'email');
  const event = String(row.event ?? 'order_update');
  const status = String(row.status ?? 'sent');
  const createdAt = String(row.created_at ?? new Date().toISOString());
  const preview = String(row.preview ?? row.recipient ?? '');
  const merchantRead = Boolean(row.merchant_read);

  return {
    id: `${DELIVERY_ID_PREFIX}${id}`,
    dedup_key: `delivery-${id}`,
    registryCode: 'customer_delivery_log',
    zone: status === 'failed' ? 'zone1_issues' : 'zone3_urgent',
    category: 'Orders',
    severity: status === 'failed' ? 'critical' : 'info',
    status: merchantRead ? 'read' : 'unread',
    title: `${channel.toUpperCase()} · ${event.replace(/_/g, ' ')}`,
    titleAr: `${channel.toUpperCase()} · ${event.replace(/_/g, ' ')}`,
    description: preview,
    descriptionAr: preview,
    timestamp: createdAt,
    read: merchantRead,
    dismissed: false,
    actionLabel: 'View orders',
    actionLabelAr: 'عرض الطلبات',
    actionType: 'navigate',
    destination: 'orders',
    metadata: {
      deliveryId: id,
      orderId: row.order_id ? String(row.order_id) : undefined,
      orderNumber: row.order_number ? String(row.order_number) : undefined,
    },
  };
}

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

export interface NotificationsContextValue {
  notifications: NotificationItem[];
  zone1Items: NotificationItem[];
  zone2Items: NotificationItem[];
  zone3Items: NotificationItem[];
  unreadCounts: {
    zone1: number;
    zone2: number;
    zone3: number;
    total: number;
  };
  isLoading: boolean;
  markAsRead: (id: string) => void;
  markAllAsRead: (zone?: NotificationZone) => void;
  dismissNotification: (id: string) => void;
  snoozeNotification: (id: string, snoozeMinutes?: number) => void;
  handleAction: (item: NotificationItem, onNavigateTab?: (tab: string) => void) => void;
  refresh: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

function useNotificationsInternal(): NotificationsContextValue {
  const {
    activeStore,
    currentOrders,
    currentProducts,
    currentCustomers,
    currentCoupons,
    dataSource,
    revalidateResource,
  } = useTenant();
  const { locale } = usePrefs();
  const isAr = locale === 'ar';

  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => getStoredSet(DISMISSED_KEY));
  const [readIds, setReadIds] = useState<Set<string>>(() => getStoredSet(READ_KEY));
  const [snoozedMap, setSnoozedMap] = useState<Record<string, string>>(() => getSnoozedMap());
  const [engineItems, setEngineItems] = useState<NotificationItem[]>([]);
  const [deliveryItems, setDeliveryItems] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const rawItems = useMemo(
    () => [...deliveryItems, ...engineItems],
    [deliveryItems, engineItems],
  );

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
      setEngineItems(generated);
      notificationAPI.saveToCache(generated);
    } finally {
      setIsLoading(false);
    }
  }, [activeStore, currentOrders, currentProducts, currentCustomers, currentCoupons]);

  const loadDeliveryNotifications = useCallback(async () => {
    if (dataSource !== 'api' || !hasLiveApiAuth() || !activeStore?.id) {
      setDeliveryItems([]);
      return;
    }
    try {
      const res = await fetchNotificationDeliveriesApi(activeStore.id, {
        unread_only: false,
        limit: 40,
      });
      const rows = (res.data?.items ?? []) as Record<string, unknown>[];
      setDeliveryItems(rows.map(mapDeliveryRowToNotification));
    } catch {
      setDeliveryItems([]);
    }
  }, [activeStore?.id, dataSource]);

  const revalidateRef = useRef(revalidateResource);
  const deliveryLoaderRef = useRef(loadDeliveryNotifications);
  const storeIdRef = useRef(activeStore?.id);
  revalidateRef.current = revalidateResource;
  deliveryLoaderRef.current = loadDeliveryNotifications;
  storeIdRef.current = activeStore?.id;

  useEffect(() => {
    computeNotifications();
  }, [computeNotifications]);

  useEffect(() => {
    // Defer delivery fetch so /admin dashboard shell is not competing with catalog/orders.
    let cancelled = false;
    const run = () => {
      if (!cancelled) void loadDeliveryNotifications();
    };
    const ric = (window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback;
    const idleId = typeof ric === 'function' ? ric(run, { timeout: 3500 }) : 0;
    const timeoutId = typeof ric === 'function' ? 0 : window.setTimeout(run, 2000);
    return () => {
      cancelled = true;
      if (idleId && typeof (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback === 'function') {
        (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback?.(idleId);
      }
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [loadDeliveryNotifications]);

  // Realtime background sync every 120s (reduced from 30s to eliminate CPU spikes)
  useRealtimeSync(computeNotifications, 120000);

  // Unlock Web Audio on first tap/click (required for mobile notification sound)
  useEffect(() => ensureNotificationAudioUnlock(), []);

  // Single shared lean poll while any dashboard notifications hook is mounted
  useEffect(() => {
    if (dataSource !== 'api' || !activeStore?.id) return;

    commercePollListeners += 1;

    const pollCommerce = async () => {
      if (commercePollInFlight) return;
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      if (!isAdminDashboardSurface()) return;
      const sid = storeIdRef.current;
      if (!sid) return;
      const now = Date.now();
      if (now - lastCommercePollAt < 20_000) return;
      lastCommercePollAt = now;
      commercePollInFlight = true;
      try {
        await Promise.all([
          revalidateRef.current(sid, 'orders'),
          revalidateRef.current(sid, 'customers'),
          deliveryLoaderRef.current(),
        ]);
      } catch {
        /* keep last snapshot */
      } finally {
        commercePollInFlight = false;
      }
    };

    if (commercePollTimer == null) {
      commercePollTimer = window.setInterval(() => {
        void pollCommerce();
      }, 25_000);
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') void pollCommerce();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      commercePollListeners = Math.max(0, commercePollListeners - 1);
      document.removeEventListener('visibilitychange', onVisible);
      if (commercePollListeners === 0 && commercePollTimer != null) {
        window.clearInterval(commercePollTimer);
        commercePollTimer = null;
      }
    };
  }, [activeStore?.id, dataSource]);

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

  // Play chime + vibrate when brand-new unread alerts appear (dashboard open, mobile OK after unlock)
  useEffect(() => {
    const storeId = activeStore?.id || null;
    if (sharedSoundStoreId !== storeId) {
      sharedSoundStoreId = storeId;
      sharedSeenSoundKeys = null;
    }

    const unread = activeNotifications.filter((item) => !item.read && !item.dismissed);
    const keys = unread.map(soundSignature);

    if (sharedSeenSoundKeys === null) {
      sharedSeenSoundKeys = new Set(keys);
      return;
    }

    const freshItems = unread.filter((item) => !sharedSeenSoundKeys!.has(soundSignature(item)));
    if (freshItems.length > 0 && isAdminDashboardSurface()) {
      const kind = inferAlertSoundKind(freshItems[0]);
      playNotificationSound(kind);
    }

    for (const key of keys) {
      sharedSeenSoundKeys.add(key);
    }
  }, [activeNotifications, activeStore?.id]);

  // Mark as read (optimistic)
  const markAsRead = useCallback(
    (id: string) => {
      setReadIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        saveStoredSet(READ_KEY, next);
        return next;
      });
      if (id.startsWith(DELIVERY_ID_PREFIX) && dataSource === 'api' && hasLiveApiAuth()) {
        const deliveryId = id.slice(DELIVERY_ID_PREFIX.length);
        void markNotificationDeliveriesReadApi(activeStore?.id, { ids: [deliveryId] }).then(() =>
          loadDeliveryNotifications(),
        );
        setDeliveryItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, read: true, status: 'read' } : item)),
        );
        return;
      }
      void notificationAPI.markAsRead(id);
    },
    [activeStore?.id, dataSource, loadDeliveryNotifications],
  );

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
      if (dataSource === 'api' && hasLiveApiAuth() && activeStore?.id) {
        void markNotificationDeliveriesReadApi(activeStore.id, { all: true }).then(() =>
          loadDeliveryNotifications(),
        );
        setDeliveryItems((prev) => prev.map((item) => ({ ...item, read: true, status: 'read' })));
      }
    },
    [activeNotifications, activeStore?.id, dataSource, loadDeliveryNotifications],
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

      if (item.actionType === 'product' || item.destination === 'products') {
        const prodId = item.metadata?.productId || (item as any).productId;
        if (prodId) {
          try {
            sessionStorage.setItem('target_edit_product_id', String(prodId));
          } catch {}
        }
        if (onNavigateTab) {
          onNavigateTab('products');
        }
        return;
      }

      if (item.destination === 'orders') {
        const orderId = item.metadata?.orderNumber || item.metadata?.orderId || item.id;
        if (orderId) {
          try {
            sessionStorage.setItem('target_view_order_id', String(orderId));
          } catch {}
        }
        if (onNavigateTab) {
          onNavigateTab('orders');
        }
        return;
      }

      // Default navigate
      if (onNavigateTab && item.destination) {
        onNavigateTab(item.destination);
      }
    },
    [markAsRead, isAr],
  );

  return useMemo(
    () => ({
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
      refresh: () => {
        computeNotifications();
        void loadDeliveryNotifications();
      },
    }),
    [
      activeNotifications,
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
      computeNotifications,
      loadDeliveryNotifications,
    ],
  );
}

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value = useNotificationsInternal();
  return React.createElement(NotificationsContext.Provider, { value }, children);
};

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (ctx) return ctx;
  // Fallback if mounted outside NotificationsProvider
  return useNotificationsInternal();
}
