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

let cachedSessionRaw: string | null = null;
let cachedSessionObj: AuthSession | null = null;
let cachedSessionInitialized = false;

function invalidateSessionCache(): void {
  cachedSessionInitialized = false;
  cachedSessionRaw = null;
  cachedSessionObj = null;
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (!e.key || e.key === STORAGE_KEY || e.key === BACKUP_STORAGE_KEY || e.key === EXPLICIT_LOGOUT_KEY) {
      invalidateSessionCache();
    }
  });
}

function emitAuthChange(): void {
  invalidateSessionCache();
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
      cachedSessionInitialized = true;
      cachedSessionRaw = null;
      cachedSessionObj = null;
      return null;
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (cachedSessionInitialized && raw === cachedSessionRaw && cachedSessionObj) {
      return cachedSessionObj;
    }

    if (raw) {
      const parsed = JSON.parse(raw) as AuthSession;
      if (parsed?.token && parsed?.user?.id && parsed?.portal) {
        cachedSessionInitialized = true;
        cachedSessionRaw = raw;
        cachedSessionObj = parsed;
        return parsed;
      }
    }

    // Lifetime fallback: recover from backup storage if primary key was cleared or dropped
    const backupRaw = localStorage.getItem(BACKUP_STORAGE_KEY);
    if (backupRaw) {
      const backupParsed = JSON.parse(backupRaw) as AuthSession;
      if (backupParsed?.token && backupParsed?.user?.id && backupParsed?.portal) {
        localStorage.setItem(STORAGE_KEY, backupRaw);
        cachedSessionInitialized = true;
        cachedSessionRaw = backupRaw;
        cachedSessionObj = backupParsed;
        return backupParsed;
      }
    }

    cachedSessionInitialized = true;
    cachedSessionRaw = null;
    cachedSessionObj = null;
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
    localStorage.removeItem(EXPLICIT_LOGOUT_KEY);

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
    emitAuthChange();
  } catch {
    /* ignore */
  }
}

export function patchAuthSessionUser(updates: { email?: string; name?: string; storeName?: string }): void {
  try {
    const current = readAuthSession();
    if (!current) return;
    const next: AuthSession = {
      ...current,
      user: {
        ...current.user,
        ...(updates.email ? { email: updates.email } : {}),
        ...(updates.name ? { name: updates.name } : {}),
      },
      ...(updates.storeName ? { storeName: updates.storeName } : {}),
    };
    writeAuthSession(next);
  } catch {
    /* ignore */
  }
}

export function getAuthToken(): string | null {
  return readAuthSession()?.token ?? null;
}

/** Real Sanctum bearer only — mock-* tokens never hit Laravel. */
export function hasLiveApiAuth(): boolean {
  const token = getAuthToken();
  return Boolean(token && !token.startsWith('mock-'));
}
