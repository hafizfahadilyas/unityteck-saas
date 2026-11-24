import { useCallback, useEffect, useRef } from 'react';

/**
 * While `active`, push a same-URL history entry so browser / Android Back
 * closes this admin inner layer (edit product, shipping section, …)
 * instead of jumping out of the tab or the whole dashboard.
 *
 * UI Back should call `requestClose()` so the stack stays clean (history.back).
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

    const prev =
      window.history.state && typeof window.history.state === 'object'
        ? (window.history.state as Record<string, unknown>)
        : {};
    const state = {
      ...prev,
      unityteckSpa: 'admin',
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
      // Tab switch / unmount: drop listener only — do not history.back()
      // (that would steal navigation from the new tab).
    };
  }, [active]);

  const requestClose = useCallback(() => {
    if (pushedRef.current && typeof window !== 'undefined') {
      try {
        window.history.back();
        return;
      } catch {
        /* fall through */
      }
    }
    pushedRef.current = false;
    onCloseRef.current();
  }, []);

  return { requestClose };
}
