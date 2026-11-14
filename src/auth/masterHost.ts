/**
 * Master Admin host lock — central Hostinger only.
 * Live: https://mieraf-ksa.com/master/login
 * Flowers (giftshop-sa.com) and other store hosts must NOT serve /master*.
 */

export const MASTER_ADMIN_ORIGIN = 'https://mieraf-ksa.com';
export const MASTER_ADMIN_LOGIN_URL = `${MASTER_ADMIN_ORIGIN}/master/login`;

const CENTRAL_HOSTS = new Set(['mieraf-ksa.com', 'www.mieraf-ksa.com']);

const DEV_HOSTS = new Set(['localhost', '127.0.0.1']);

export function normalizeHost(hostname?: string | null): string {
  return String(hostname || '')
    .toLowerCase()
    .replace(/^www\./, '')
    .trim();
}

/** True when this browser host may render Master Admin UI. */
export function isMasterAdminHost(hostname?: string | null): boolean {
  const host = normalizeHost(hostname);
  if (!host) return false;
  if (CENTRAL_HOSTS.has(host) || CENTRAL_HOSTS.has(`www.${host}`)) return true;
  if (host === 'mieraf-ksa.com') return true;
  // Local Vite / LAN only — never treat store production hosts as Master.
  if (DEV_HOSTS.has(host)) return true;
  if (/^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host)) return true;
  return false;
}

/** Store / flowers production hosts that must bounce Master to central. */
export function isStoreOnlyHost(hostname?: string | null): boolean {
  const host = normalizeHost(hostname);
  if (!host) return false;
  if (isMasterAdminHost(host)) return false;
  return (
    host.includes('giftshop') ||
    host.includes('flowers') ||
    host.includes('makkah') ||
    host.includes('tanjeed') ||
    host.includes('bleco') ||
    host.includes('alsaeedi') ||
    host.endsWith('.sa')
  );
}

export function masterLoginUrl(search = ''): string {
  const q = search && search.startsWith('?') ? search : search ? `?${search}` : '';
  return `${MASTER_ADMIN_LOGIN_URL}${q}`;
}

/** Hard navigation to central Master (cross-host). */
export function redirectToCentralMaster(pathAndSearch = '/master/login'): void {
  if (typeof window === 'undefined') return;
  const path = pathAndSearch.startsWith('/') ? pathAndSearch : `/${pathAndSearch}`;
  const target = `${MASTER_ADMIN_ORIGIN}${path}`;
  if (window.location.href === target) return;
  window.location.replace(target);
}
