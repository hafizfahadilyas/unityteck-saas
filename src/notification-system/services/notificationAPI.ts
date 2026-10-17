import { NotificationItem } from '../types/notification.types';

const STORAGE_CACHE_KEY = 'souq_dashboard_notifications_cache';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL

interface CacheEnvelope {
  timestamp: number;
  data: NotificationItem[];
}

export class NotificationAPI {
  private static instance: NotificationAPI;

  private constructor() {}

  public static getInstance(): NotificationAPI {
    if (!NotificationAPI.instance) {
      NotificationAPI.instance = new NotificationAPI();
    }
    return NotificationAPI.instance;
  }

  public getCachedNotifications(): NotificationItem[] | null {
    try {
      const raw = localStorage.getItem(STORAGE_CACHE_KEY);
      if (!raw) return null;
      const parsed: CacheEnvelope = JSON.parse(raw);
      if (Date.now() - parsed.timestamp > CACHE_TTL_MS) {
        return null; // Cache expired
      }
      return parsed.data;
    } catch {
      return null;
    }
  }

  public saveToCache(notifications: NotificationItem[]): void {
    try {
      const envelope: CacheEnvelope = {
        timestamp: Date.now(),
        data: notifications,
      };
      localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(envelope));
    } catch (e) {
      console.warn('Failed to cache notifications', e);
    }
  }

  public async fetchNotifications(initialLimit = 50): Promise<NotificationItem[]> {
    // Check cache first
    const cached = this.getCachedNotifications();
    if (cached && cached.length > 0) {
      return cached.slice(0, initialLimit);
    }

    // Simulated network delay < 100ms
    await new Promise((resolve) => setTimeout(resolve, 60));
    return [];
  }

  public async markAsRead(id: string): Promise<boolean> {
    try {
      const cached = this.getCachedNotifications() || [];
      const updated = cached.map((n) => (n.id === id ? { ...n, read: true } : n));
      this.saveToCache(updated);
      return true;
    } catch {
      return false;
    }
  }

  public async markAllAsRead(): Promise<boolean> {
    try {
      const cached = this.getCachedNotifications() || [];
      const updated = cached.map((n) => ({ ...n, read: true }));
      this.saveToCache(updated);
      return true;
    } catch {
      return false;
    }
  }

  public async dismissNotification(id: string): Promise<boolean> {
    try {
      const cached = this.getCachedNotifications() || [];
      const updated = cached.map((n) => (n.id === id ? { ...n, dismissed: true } : n));
      this.saveToCache(updated);
      return true;
    } catch {
      return false;
    }
  }

  public async snoozeNotification(id: string, snoozeMinutes = 60): Promise<boolean> {
    try {
      const snoozedUntil = new Date(Date.now() + snoozeMinutes * 60 * 1000).toISOString();
      const cached = this.getCachedNotifications() || [];
      const updated = cached.map((n) =>
        n.id === id ? { ...n, snoozedUntil, read: true } : n,
      );
      this.saveToCache(updated);
      return true;
    } catch {
      return false;
    }
  }
}

export const notificationAPI = NotificationAPI.getInstance();
