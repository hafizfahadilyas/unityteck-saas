import { useCallback, useEffect, useRef } from 'react';

type HistoryState = Record<string, unknown> & {
  unityteckSpa?: string;
  adminInner?: boolean;
  adminInnerTs?: number;
};

function readState(): HistoryState {
  if (typeof window === 'undefined') return {};
  const raw = window.history.state;
  if (raw && typeof raw === 'object') return { ...(raw as HistoryState) };
  return {};
}

/**
 * While `active`, push a same-URL history entry so browser / Android Back
 * closes this admin inner layer (edit product, shipping section, …)
 * instead of jumping out of the tab or the whole dashboard.
 *
 * UI Back should call `requestClose()`:
 * - Soft-close (replaceState + onClose) so a polluted tab stack cannot
 *   fling the merchant to a random previous tab.
 * - Browser Back still uses popstate → onClose.
 */
export function useAdminInnerLayer(active: boolean, onClose: () => void) {
  const pushedRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!active || typeof window === 'undefined') {
      pushedRef.current = false;
      return;
    }

    const prev = readState();
    const state: HistoryState = {
      ...prev,
      unityteckSpa: prev.unityteckSpa || 'admin',
      adminInner: true,
      adminInnerTs: Date.now(),
    };
    try {
      window.history.pushState(state, '', window.location.href);
      pushedRef.current = true;
    } catch {
      pushedRef.current = false;
    }

    const onPop = () => {
      if (!pushedRef.current) return;
      pushedRef.current = false;
      onCloseRef.current();
    };

    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      // Tab switch / unmount: do not history.back() (steals the new tab).
      // If this entry is still on top, strip the inner flag so it cannot
      // resurrect a ghost layer later.
      if (pushedRef.current) {
        try {
          const st = readState();
          if (st.adminInner) {
            const next = { ...st };
            delete next.adminInner;
            delete next.adminInnerTs;
            window.history.replaceState(next, '', window.location.href);
          }
        } catch {
          /* ignore */
        }
        pushedRef.current = false;
      }
    };
  }, [active]);

  const requestClose = useCallback(() => {
    if (typeof window !== 'undefined' && pushedRef.current) {
      try {
        const st = readState();
        if (st.adminInner) {
          const next = { ...st };
          delete next.adminInner;
          delete next.adminInnerTs;
          window.history.replaceState(next, '', window.location.href);
          pushedRef.current = false;
          onCloseRef.current();
          return;
        }
      } catch {
        /* fall through */
      }
    }
    pushedRef.current = false;
    onCloseRef.current();
  }, []);

  return { requestClose };
}
