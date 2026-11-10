import type { AuthPortal, AuthSession } from './session';
import { writeAuthSession } from './session';
import { abilitiesFor, roleLabel, roleLevel, normalizeRole } from './roles';
import {
  assertStoreLoginEmailAllowed,
  isMasterLoginEmail,
  type RegisteredMerchant,
} from './api';

type ClerkUserLike = {
  id: string;
  primaryEmailAddress?: { emailAddress?: string } | null;
  emailAddresses?: Array<{ emailAddress?: string }>;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
  publicMetadata?: Record<string, unknown> | null;
};

export type ClerkSessionOptions = {
  /** From ?store= / ?demo= — when set, email must belong to this store */
  storeParam?: string | null;
  /** When false, build session object only — do not write until Sanctum exchange succeeds */
  persist?: boolean;
};

/** Map Clerk user → tab session. A closed browser or logout asks for OTP again. */
export function sessionFromClerkUser(
  portal: AuthPortal,
  user: ClerkUserLike,
  clerkToken?: string | null,
  options?: ClerkSessionOptions,
): AuthSession {
  const email =
    (user.primaryEmailAddress?.emailAddress ||
      user.emailAddresses?.[0]?.emailAddress ||
      `${user.id}@clerk.local`)
      .trim()
      .toLowerCase();

  const name =
    user.fullName ||
    [user.firstName, user.lastName].filter(Boolean).join(' ') ||
    email.split('@')[0];

  const metaRole = String(user.publicMetadata?.role || '').toLowerCase();
  const wantsMaster =
    portal === 'master' ||
    metaRole === 'super_admin' ||
    metaRole === 'master';

  if (wantsMaster) {
    if (!isMasterLoginEmail(email) && metaRole !== 'super_admin' && metaRole !== 'master') {
      throw new Error('MASTER_EMAIL_REQUIRED');
    }
    const role = normalizeRole('super_admin');
    const session: AuthSession = {
      token: clerkToken || `clerk-master-${user.id}`,
      portal: 'master',
      user: {
        id: user.id,
        name,
        email,
        role,
        role_label: roleLabel(role),
        role_level: roleLevel(role),
        avatar: user.imageUrl || undefined,
      },
      storeId: null,
      storeName: null,
      abilities: abilitiesFor(role),
      isLifetime: false,
      loggedInAt: Date.now(),
    };
    if (options?.persist !== false) {
      writeAuthSession(session);
    }
    return session;
  }

  // Store portal: ONLY the registered email for that store may open it.
  let merchant: RegisteredMerchant;
  try {
    merchant = assertStoreLoginEmailAllowed(email, options?.storeParam);
  } catch (err) {
    throw err instanceof Error ? err : new Error('STORE_EMAIL_UNREGISTERED');
  }

  // Store owner login = Admin only (no manager seat on merchant portal).
  const role = normalizeRole('admin');
  const session: AuthSession = {
    token: clerkToken || `clerk-store-${user.id}`,
    portal: 'store',
    user: {
      id: user.id,
      name,
      email: merchant.email || email,
      role,
      role_label: roleLabel(role),
      role_level: roleLevel(role),
      avatar: user.imageUrl || undefined,
    },
    storeId: merchant.storeId,
    storeName: merchant.storeName,
    abilities: abilitiesFor(role),
    isLifetime: false,
    loggedInAt: Date.now(),
  };
  if (options?.persist !== false) {
    writeAuthSession(session);
  }
  return session;
}

/**
 * Clerk publishable keys are public by design (safe in SPA). This fallback keeps
 * Hostinger/static deploys working when Vite build env omitted VITE_CLERK_PUBLISHABLE_KEY.
 */
export const CLERK_PUBLISHABLE_KEY_FALLBACK =
  'pk_test_cXVpZXQtYWxiYWNvcmUtMzkwNi5jbGVyay5hY2NvdW50cy5kZXYk';

function isValidClerkPublishableKey(key: string): boolean {
  const k = String(key || '').trim();
  if (!k.startsWith('pk_test_') && !k.startsWith('pk_live_')) return false;
  if (k.length < 24) return false;
  if (/x{3,}|REPLACE|your_key|xxxxx/i.test(k)) return false;
  return true;
}

/**
 * Resolve Clerk publishable key from Vite env (build/dev), runtime window inject,
 * or bundled public fallback (Hostinger static deploys must never boot without it).
 */
export function getClerkPublishableKey(): string {
  // index.html sets window.__CLERK_PUBLISHABLE_KEY before the app bundle — prefer that in browser.
  try {
    const fromWindow = String(
      (typeof window !== 'undefined' &&
        (window as Window & { __CLERK_PUBLISHABLE_KEY?: string }).__CLERK_PUBLISHABLE_KEY) ||
        '',
    ).trim();
    if (isValidClerkPublishableKey(fromWindow)) return fromWindow;
  } catch {
    /* ignore */
  }
  const fromEnv = String(import.meta.env?.VITE_CLERK_PUBLISHABLE_KEY || '').trim();
  if (isValidClerkPublishableKey(fromEnv)) return fromEnv;
  if (isValidClerkPublishableKey(CLERK_PUBLISHABLE_KEY_FALLBACK)) {
    return CLERK_PUBLISHABLE_KEY_FALLBACK;
  }
  return '';
}

/** True when Vite/env has no real key (placeholder or empty) — show .env hint on load failure. */
export function clerkEnvKeyMissing(): boolean {
  const fromEnv = String(import.meta.env?.VITE_CLERK_PUBLISHABLE_KEY || '').trim();
  return !isValidClerkPublishableKey(fromEnv);
}

export function isClerkConfigured(): boolean {
  return isValidClerkPublishableKey(getClerkPublishableKey());
}
