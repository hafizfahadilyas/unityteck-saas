import { readAuthSession } from './session';

let inflight: Promise<boolean> | null = null;

/**
 * Mint a fresh Sanctum token from the saved admin email.
 * Does not clear the current session. Used when a request returns 401.
 */
export function renewLifetimeToken(): Promise<boolean> {
  if (inflight) return inflight;
  inflight = (async () => {
    const session = readAuthSession();
    if (!session?.user?.email || !session.portal) return false;
    const { exchangeClerkForSanctum } = await import('./api');
    const next = await exchangeClerkForSanctum(
      session.portal,
      session.user.email,
      session.storeId,
    );
    return Boolean(next?.token);
  })().finally(() => {
    inflight = null;
  });
  return inflight;
}
