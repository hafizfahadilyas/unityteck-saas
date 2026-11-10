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
    // Renew only works with a Clerk JWT proof — Sanctum PATs cannot re-exchange.
    const proof =
      session.token &&
      !session.token.includes('|') &&
      !session.token.startsWith('mock-') &&
      session.token.split('.').length === 3
        ? session.token
        : null;
    if (!proof) return false;
    try {
      const next = await exchangeClerkForSanctum(
        session.portal,
        session.user.email,
        session.storeId,
        proof,
      );
      return Boolean(next?.token?.includes('|'));
    } catch {
      return false;
    }
  })().finally(() => {
    inflight = null;
  });
  return inflight;
}
