/**
 * Auth session for the open browser tab only.
 * Logout or a closed browser session requires a fresh email OTP.
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

function clearDurableSession(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(BACKUP_STORAGE_KEY);
      localStorage.removeItem(LIFETIME_FLAG);
      localStorage.removeItem('unityteck_explicit_logout');
    }
  } catch {
    /* ignore */
  }
  try {
    if (typeof document === 'undefined') return;
    const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${STORAGE_KEY}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
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

export function readAuthSession(): AuthSession | null {
  try {
    clearDurableSession();
    if (typeof sessionStorage === 'undefined') return null;
    const parsed = parseSession(sessionStorage.getItem(STORAGE_KEY));
    if (!parsed) return null;
    const healed = healAuthSession(parsed);
    if (healed !== parsed) {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(healed));
      } catch {
        /* ignore */
      }
    }
    return healed;
  } catch {
    return null;
  }
}

export function writeAuthSession(session: AuthSession): void {
  try {
    if (typeof sessionStorage === 'undefined') return;
    clearDurableSession();
    const healed = healAuthSession(session);
    const next: AuthSession = {
      ...healed,
      isLifetime: false,
      loggedInAt: healed.loggedInAt || Date.now(),
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    emitAuthChange();
  } catch {
    /* ignore */
  }
}

/** Ends the tab session. The next login must verify a fresh email OTP. */
export function clearAuthSession(force = false): void {
  try {
    if (!force) return;
    clearDurableSession();
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(STORAGE_KEY);
    }
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
