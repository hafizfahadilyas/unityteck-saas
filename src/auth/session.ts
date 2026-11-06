/**
 * Lean auth session (Sanctum bearer). Soft SPA — no full reload.
 * Configured with Lifetime Session Persistence (stays alive indefinitely until explicit logout).
 */

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

const STORAGE_KEY = 'unityteck_auth';
const BACKUP_STORAGE_KEY = 'unityteck_auth_lifetime_backup';
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

export function readAuthSession(): AuthSession | null {
  try {
    if (typeof localStorage === 'undefined') return null;

    // If user explicitly performed logout, respect it until next login
    if (localStorage.getItem(EXPLICIT_LOGOUT_KEY) === '1') {
      return null;
    }

    const primary = parseSession(localStorage.getItem(STORAGE_KEY));
    if (primary) return primary;

    // Lifetime fallback: backup key, then long-lived cookie (survives a cleared primary key).
    const backup = parseSession(localStorage.getItem(BACKUP_STORAGE_KEY));
    if (backup) {
      const serialized = JSON.stringify(backup);
      localStorage.setItem(STORAGE_KEY, serialized);
      writeCookieSession(serialized);
      return backup;
    }

    const fromCookie = parseSession(readCookieSession());
    if (fromCookie) {
      const serialized = JSON.stringify(fromCookie);
      localStorage.setItem(STORAGE_KEY, serialized);
      localStorage.setItem(BACKUP_STORAGE_KEY, serialized);
      return fromCookie;
    }

    return null;
  } catch {
    return null;
  }
}

export function writeAuthSession(session: AuthSession): void {
  try {
    if (typeof localStorage === 'undefined') return;

    const sessionWithLifetime: AuthSession = {
      ...session,
      isLifetime: true,
      loggedInAt: session.loggedInAt || Date.now(),
    };

    const serialized = JSON.stringify(sessionWithLifetime);
    localStorage.setItem(STORAGE_KEY, serialized);
    localStorage.setItem(BACKUP_STORAGE_KEY, serialized);
    localStorage.setItem('unityteck_session_lifetime', '1');
    localStorage.removeItem(EXPLICIT_LOGOUT_KEY);
    writeCookieSession(serialized);

    emitAuthChange();
  } catch {
    /* ignore */
  }
}

/**
 * Clears session.
 * Protected: If force is not true, auto-logout attempts are prevented to keep the dashboard session alive lifetime.
 */
export function clearAuthSession(force = false): void {
  try {
    if (!force) {
      console.warn('[Unityteck Auth] clearAuthSession() called without force=true; ignored to keep session alive lifetime.');
      return;
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(EXPLICIT_LOGOUT_KEY, '1');
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(BACKUP_STORAGE_KEY);
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
