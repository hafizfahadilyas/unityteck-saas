/**
 * Lean auth session (Sanctum bearer). Soft SPA — no full reload.
 */

export type AuthPortal = 'master' | 'store';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  role_label?: string;
  role_level?: number;
};

export type AuthSession = {
  token: string;
  portal: AuthPortal;
  user: AuthUser;
  storeId?: string | null;
  storeName?: string | null;
  /** Phase 2.3 — ability list from API (UI hint only). */
  abilities?: string[];
};

const STORAGE_KEY = 'unityteck_auth';

function emitAuthChange(): void {
  try {
    window.dispatchEvent(new Event('unityteck-auth'));
  } catch {
    /* ignore */
  }
}

export function readAuthSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.token || !parsed?.user?.id || !parsed?.portal) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeAuthSession(session: AuthSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  emitAuthChange();
}

export function clearAuthSession(): void {
  localStorage.removeItem(STORAGE_KEY);
  emitAuthChange();
}

export function getAuthToken(): string | null {
  return readAuthSession()?.token ?? null;
}

/** Real Sanctum bearer only — mock-* tokens never hit Laravel. */
export function hasLiveApiAuth(): boolean {
  const token = getAuthToken();
  return Boolean(token && !token.startsWith('mock-'));
}
