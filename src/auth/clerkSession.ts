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
};

/** Map Clerk user → Unityteck lifetime AuthSession (registered email only). */
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
      isLifetime: true,
      loggedInAt: Date.now(),
    };
    writeAuthSession(session);
    return session;
  }

  // Store portal: ONLY the registered email for that store may open it.
  let merchant: RegisteredMerchant;
  try {
    merchant = assertStoreLoginEmailAllowed(email, options?.storeParam);
  } catch (err) {
    throw err instanceof Error ? err : new Error('STORE_EMAIL_UNREGISTERED');
  }

  const role = normalizeRole('manager');
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
    isLifetime: true,
    loggedInAt: Date.now(),
  };
  writeAuthSession(session);
  return session;
}

export function isClerkConfigured(): boolean {
  const key = String(import.meta.env?.VITE_CLERK_PUBLISHABLE_KEY || '').trim();
  return key.startsWith('pk_');
}

export function getClerkPublishableKey(): string {
  return String(import.meta.env?.VITE_CLERK_PUBLISHABLE_KEY || '').trim();
}
