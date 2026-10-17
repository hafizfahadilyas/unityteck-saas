import { useEffect, useRef } from 'react';

export function useRealtimeSync(onSync: () => void, pollIntervalMs: number = 30000) {
  const syncRef = useRef(onSync);
  syncRef.current = onSync;

  useEffect(() => {
    // 1. Polling timer (default 30s)
    const interval = setInterval(() => {
      syncRef.current();
    }, pollIntervalMs);

    // 2. Window focus & visibility change sync
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncRef.current();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // 3. Storage event sync across tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'souq_dashboard_notifications_cache') {
        syncRef.current();
      }
    };
    window.addEventListener('storage', handleStorage);

    // 4. Custom app sync event
    const handleCustomSync = () => {
      syncRef.current();
    };
    window.addEventListener('souq:notifications_sync', handleCustomSync);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('souq:notifications_sync', handleCustomSync);
    };
  }, [pollIntervalMs]);
}
