/**
 * Auth session for the open browser tab only.
 * Logout or a closed browser session requires a fresh email OTP.
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
    return parseSession(sessionStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export function writeAuthSession(session: AuthSession): void {
  try {
    if (typeof sessionStorage === 'undefined') return;
    clearDurableSession();
    const next: AuthSession = {
      ...session,
      isLifetime: false,
      loggedInAt: session.loggedInAt || Date.now(),
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
