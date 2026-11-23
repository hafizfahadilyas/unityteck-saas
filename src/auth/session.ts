/**
 * Auth session — lifetime until explicit logout.
 * Survives tab close, Safari background, and browser restart (localStorage + backup).
 */

import { abilitiesFor, normalizeRole, roleLabel, roleLevel } from './roles';

export type AuthPortal = 'master' | 'store';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  role_label?: string;
  role_level?: number;
  avatar?: string;
};

export type AuthSession = {
  token: string;
  portal: AuthPortal;
  user: AuthUser;
  storeId?: string | null;
  storeName?: string | null;
  /** Phase 2.3 — ability list from API (UI hint only). */
  abilities?: string[];
  isLifetime?: boolean;
  loggedInAt?: number;
};

const LIMITED_STORE_ROLES = new Set([
  'support',
  'sales',
  'marketing',
  'seo',
  'content',
  'developer',
  'viewer',
  'store_viewer',
  'store_staff',
  'cashier',
]);

/**
 * Heal legacy / cross-store sessions so flowers + coffee + bleco owners
 * never land as viewer without products.write (categories blocked).
 */
function healAuthSession(session: AuthSession): AuthSession {
  const rawRole = String(session.user?.role || '').trim();
  const rawLower = rawRole.toLowerCase();
  const label = String(session.user?.role_label || '').toLowerCase();
  const abs = Array.isArray(session.abilities) ? session.abilities : [];
  let role = normalizeRole(rawRole);

  if (session.portal === 'store') {
    const explicitlyLimited =
      LIMITED_STORE_ROLES.has(rawLower) &&
      !label.includes('owner') &&
      !label.includes('admin') &&
      !label.includes('manager') &&
      !abs.includes('store:*');

    const looksLikePrimaryOwner =
      label.includes('owner') ||
      label.includes('admin') ||
      label.includes('manager') ||
      abs.includes('store:*') ||
      ['store_owner', 'owner', 'storeowner', 'admin', 'manager', 'store_admin', 'store_manager'].includes(
        rawLower,
      ) ||
      role === 'admin' ||
      role === 'manager';

    // Bad legacy: store_owner / empty abilities collapsed to viewer → restore admin
    if (!explicitlyLimited && looksLikePrimaryOwner && (role === 'viewer' || rawLower === 'store_owner')) {
      role = 'admin';
    }
  }

  const fromRole = abilitiesFor(role);
  let abilities = fromRole;
  if (abs.includes('*')) {
    abilities = ['*', ...fromRole];
  } else if (abs.includes('store:*') || abs.length === 0) {
    abilities = fromRole;
  } else {
    // Role matrix is floor — never keep a truncated list that strips products.write
    abilities = [...new Set([...fromRole, ...abs])];
  }

  const roleChanged = role !== session.user.role;
  const absChanged =
    abilities.length !== abs.length || abilities.some((a, i) => a !== abs[i]);
  if (!roleChanged && !absChanged) return session;

  return {
    ...session,
    user: {
      ...session.user,
      role,
      role_label:
        session.user.role_label ||
        (session.portal === 'store' && role === 'admin' ? 'Store Owner' : roleLabel(role)),
      role_level: roleLevel(role),
    },
    abilities,
  };
}

const STORAGE_KEY = 'unityteck_auth';
const BACKUP_STORAGE_KEY = 'unityteck_auth_lifetime_backup';
const LIFETIME_FLAG = 'unityteck_session_lifetime';
const EXPLICIT_LOGOUT_KEY = 'unityteck_explicit_logout';
/** ~10 years. Session ends only when the admin signs out. */
const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 365 * 10;

function readCookieSession(): string | null {
  try {
    if (typeof document === 'undefined') return null;
    const parts = document.cookie.split(';');
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed.startsWith(`${STORAGE_KEY}=`)) continue;
      return decodeURIComponent(trimmed.slice(STORAGE_KEY.length + 1));
    }
  } catch {
    /* ignore */
  }
  return null;
}

function writeCookieSession(serialized: string | null): void {
  try {
    if (typeof document === 'undefined') return;
    const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : '';
    if (!serialized) {
      document.cookie = `${STORAGE_KEY}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
      return;
    }
    // Cookie is a short fallback; skip if payload is too large for browsers (~4KB).
    if (serialized.length > 3500) return;
    document.cookie = `${STORAGE_KEY}=${encodeURIComponent(serialized)}; Path=/; Max-Age=${COOKIE_MAX_AGE_SEC}; SameSite=Lax${secure}`;
  } catch {
    /* ignore */
  }
}

function parseSession(raw: string | null): AuthSession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AuthSession;
    if (parsed?.token && parsed?.user?.id && parsed?.portal) return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

function emitAuthChange(): void {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('unityteck-auth'));
    }
  } catch {
    /* ignore */
  }
}

function persistLifetime(session: AuthSession): AuthSession {
  const healed = healAuthSession(session);
  const next: AuthSession = {
    ...healed,
    isLifetime: true,
    loggedInAt: healed.loggedInAt || Date.now(),
  };
  const serialized = JSON.stringify(next);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, serialized);
    localStorage.setItem(BACKUP_STORAGE_KEY, serialized);
    localStorage.setItem(LIFETIME_FLAG, '1');
    localStorage.removeItem(EXPLICIT_LOGOUT_KEY);
  }
  // Drop legacy tab-only copy so Safari iOS never prefers a dying sessionStorage key.
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* ignore */
  }
  writeCookieSession(serialized);
  return next;
}

export function readAuthSession(): AuthSession | null {
  try {
    if (typeof localStorage === 'undefined') return null;

    // Explicit Sign out stays logged out until the next successful login.
    if (localStorage.getItem(EXPLICIT_LOGOUT_KEY) === '1') {
      return null;
    }

    const primary = parseSession(localStorage.getItem(STORAGE_KEY));
    if (primary) {
      const healed = healAuthSession(primary);
      if (healed !== primary) persistLifetime(healed);
      return healed;
    }

    // Lifetime fallback: backup key, then cookie, then migrate old tab-only sessionStorage.
    const backup = parseSession(localStorage.getItem(BACKUP_STORAGE_KEY));
    if (backup) {
      return persistLifetime(backup);
    }

    const fromCookie = parseSession(readCookieSession());
    if (fromCookie) {
      return persistLifetime(fromCookie);
    }

    try {
      if (typeof sessionStorage !== 'undefined') {
        const legacyTab = parseSession(sessionStorage.getItem(STORAGE_KEY));
        if (legacyTab) {
          return persistLifetime(legacyTab);
        }
      }
    } catch {
      /* ignore */
    }

    return null;
  } catch {
    return null;
  }
}

export function writeAuthSession(session: AuthSession): void {
  try {
    if (typeof localStorage === 'undefined') return;
    persistLifetime(session);
    emitAuthChange();
  } catch {
    /* ignore */
  }
}

/**
 * Clears session only on explicit logout (force=true).
 * Accidental / auto clear calls are ignored so the dashboard stays lifetime.
 */
export function clearAuthSession(force = false): void {
  try {
    if (!force) return;

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(EXPLICIT_LOGOUT_KEY, '1');
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(BACKUP_STORAGE_KEY);
      localStorage.removeItem(LIFETIME_FLAG);
    }
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      /* ignore */
    }
    writeCookieSession(null);
    emitAuthChange();
  } catch {
    /* ignore */
  }
}

export function getAuthToken(): string | null {
  return readAuthSession()?.token ?? null;
}

/** Real Sanctum PAT only (`{id}|{hash}`). Clerk JWT / mock-* / google-sso never hit Laravel. */
export function hasLiveApiAuth(): boolean {
  const token = getAuthToken();
  if (!token) return false;
  if (
    token.startsWith('mock-') ||
    token.startsWith('clerk-') ||
    token.startsWith('google-sso-')
  ) {
    return false;
  }
  // Laravel Sanctum personal access token format
  return token.includes('|');
}
