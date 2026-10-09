import { useCallback, useEffect, useState } from 'react';

function pathOnly(urlPath: string): string {
  const q = urlPath.indexOf('?');
  return q >= 0 ? urlPath.slice(0, q) : urlPath;
}

/** Soft SPA path (pushState) — no full page reload. Supports `?query` in navigate(). */
export function useSoftPath(): [string, (path: string) => void] {
  const [path, setPath] = useState(() =>
    typeof window !== 'undefined' ? window.location.pathname : '/',
  );

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((next: string) => {
    const withSlash = next.startsWith('/') ? next : `/${next}`;
    const pathname = pathOnly(withSlash);
    const full =
      withSlash === pathname
        ? pathname
        : withSlash; // includes ?search
    if (
      window.location.pathname === pathname &&
      (full === pathname || window.location.search === full.slice(pathname.length))
    ) {
      setPath(pathname);
      return;
    }
    window.history.pushState({}, '', full);
    setPath(pathname);
  }, []);

  return [path, navigate];
}

export function softNavigate(path: string): void {
  const withSlash = path.startsWith('/') ? path : `/${path}`;
  const pathname = pathOnly(withSlash);
  window.history.pushState({}, '', withSlash);
  if (window.location.pathname !== pathname) {
    // pushState already set; fire pop for listeners
  }
  window.dispatchEvent(new PopStateEvent('popstate'));
}
