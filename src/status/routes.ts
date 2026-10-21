/** Status / system page route helpers (public, Holst chrome). */

export type StatusKind =
  | 'hub'
  | '404'
  | '500'
  | '505'
  | 'offline'
  | 'under-construction'
  | 'coming-soon'
  | 'maintenance'
  | 'redirect';

const SHORT: Record<string, StatusKind> = {
  '/404': '404',
  '/500': '500',
  '/505': '505',
  '/offline': 'offline',
  '/network': 'offline',
  '/under-construction': 'under-construction',
  '/coming-soon': 'coming-soon',
  '/maintenance': 'maintenance',
  '/status': 'hub',
};

const NESTED: Record<string, StatusKind> = {
  '/status/404': '404',
  '/status/500': '500',
  '/status/505': '505',
  '/status/network': 'offline',
  '/status/offline': 'offline',
  '/status/under-construction': 'under-construction',
  '/status/coming-soon': 'coming-soon',
  '/status/maintenance': 'maintenance',
  '/status/redirect': 'redirect',
};

export function resolveStatusKind(path: string): StatusKind | null {
  const clean = path.replace(/\/$/, '') || '/';
  if (SHORT[clean]) return SHORT[clean];
  if (NESTED[clean]) return NESTED[clean];
  if (clean.startsWith('/status/')) return '404';
  return null;
}

export function isStatusPath(path: string): boolean {
  return resolveStatusKind(path) !== null;
}

/** Soft-known app routes (auth + root). Unknown → 404 when signed in. */
export function isKnownAppPath(path: string): boolean {
  const clean = path.replace(/\/$/, '') || '/';
  if (clean === '/') return true;
  if (
    clean === '/admin' ||
    clean === '/admin/login' ||
    clean === '/storefront' ||
    clean === '/shop' ||
    clean === '/coffee' ||
    clean.startsWith('/coffee') ||
    clean === '/public_html' ||
    clean.startsWith('/public_html') ||
    clean === '/car' ||
    clean.startsWith('/car') ||
    clean === '/cars' ||
    clean.startsWith('/cars') ||
    clean === '/bleco' ||
    clean.startsWith('/bleco') ||
    clean === '/flowers' ||
    clean.startsWith('/flowers') ||
    clean === '/hadaya' ||
    clean.startsWith('/hadaya') ||
    clean === '/catalog' ||
    clean === '/cart' ||
    clean === '/checkout' ||
    clean === '/crm' ||
    clean === '/profile' ||
    clean === '/orders' ||
    clean === '/account' ||
    clean === '/wishlist' ||
    clean === '/product' ||
    clean === '/thankyou' ||
    clean.startsWith('/product/') ||
    clean.startsWith('/category/') ||
    clean.startsWith('/catalog/') ||
    clean === '/master' ||
    clean === '/master/login' ||
    clean === '/master/forgot-password' ||
    clean === '/master/reset-password' ||
    clean === '/store' ||
    clean === '/store/login' ||
    clean === '/store/forgot-password' ||
    clean === '/store/reset-password' ||
    clean === '/store/register' ||
    clean === '/register' ||
    clean === '/login' ||
    clean === '/gate' ||
    clean === '/portal' ||
    clean === '/start' ||
    clean === '/clear-cache' ||
    clean === '/clear' ||
    clean === '/cache'
  ) {
    return true;
  }
  return isStatusPath(clean);
}

export const STATUS_HUB_LINKS: { path: string; kind: StatusKind; label: string }[] = [
  { path: '/status/404', kind: '404', label: '404 · Not found' },
  { path: '/status/500', kind: '500', label: '500 · Server error' },
  { path: '/status/505', kind: '505', label: '505 · HTTP not supported' },
  { path: '/status/network', kind: 'offline', label: 'Offline / no network' },
  { path: '/status/under-construction', kind: 'under-construction', label: 'Under construction' },
  { path: '/status/coming-soon', kind: 'coming-soon', label: 'Coming soon' },
  { path: '/status/maintenance', kind: 'maintenance', label: 'Maintenance' },
  { path: '/status/redirect', kind: 'redirect', label: 'Redirect demo → home' },
];
