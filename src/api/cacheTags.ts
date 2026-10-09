/**
 * Zero-stale cache bus (golden rule):
 * - Mutations bump tags → UI soft-updates (no location.reload)
 * - Cross-tab BroadcastChannel so every open tab stays fresh
 * - Never leave old maps after a successful write
 */

const versions = new Map<string, number>();
const listeners = new Set<(tag: string, version: number) => void>();

export type StoreResource =
  | 'products'
  | 'orders'
  | 'customers'
  | 'coupons'
  | 'shipping'
  | 'seo'
  | 'theme'
  | 'media'
  | 'platform'
  | 'categories'
  | 'settings';

export const DATA_EVENT = 'unityteck-data';
export const THEME_IDENTITY_EVENT = 'unityteck-theme-identity';
const CHANNEL_NAME = 'unityteck-zero-stale';

export function storeTag(storeId: string, resource: StoreResource): string {
  return `store:${storeId}:${resource}`;
}

export function platformTag(): string {
  return 'platform:metrics';
}

let bc: BroadcastChannel | null = null;
function getChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
    return null;
  }
  if (!bc) {
    try {
      bc = new BroadcastChannel(CHANNEL_NAME);
    } catch {
      bc = null;
    }
  }
  return bc;
}

function notify(tag: string, version: number, fromRemote = false) {
  listeners.forEach((fn) => {
    try {
      fn(tag, version);
    } catch {
      /* ignore subscriber errors */
    }
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(DATA_EVENT, {
        detail: { tag, version, at: Date.now(), remote: fromRemote },
      }),
    );
  }
  if (!fromRemote) {
    try {
      getChannel()?.postMessage({ tag, version, at: Date.now() });
    } catch {
      /* ignore */
    }
  }
}

/** Call once from TenantProvider to mirror other tabs' bumps. */
export function startCrossTabCacheBridge(): () => void {
  const channel = getChannel();
  if (!channel) return () => undefined;
  const onMsg = (ev: MessageEvent) => {
    const data = ev.data as { tag?: string; version?: number } | null;
    if (!data?.tag || typeof data.version !== 'number') return;
    const local = versions.get(data.tag) ?? 0;
    if (data.version > local) {
      versions.set(data.tag, data.version);
      notify(data.tag, data.version, true);
    } else {
      // Still nudge UI — peer tab had a write
      notify(data.tag, Math.max(local, data.version), true);
    }
  };
  channel.addEventListener('message', onMsg);
  return () => channel.removeEventListener('message', onMsg);
}

export function bumpCacheTag(tag: string, opts?: { localOnly?: boolean }): number {
  const next = (versions.get(tag) ?? 0) + 1;
  versions.set(tag, next);
  if (opts?.localOnly) {
    // Epoch bump only — no CustomEvent / BroadcastChannel (avoids revalidate loops)
    listeners.forEach((fn) => {
      try {
        fn(tag, next);
      } catch {
        /* ignore */
      }
    });
  } else {
    notify(tag, next);
  }
  return next;
}

export function bumpStore(storeId: string, resource: StoreResource): number {
  return bumpCacheTag(storeTag(storeId, resource));
}

/** Invalidate several resources for one store in one tick. */
export function bumpStoreMany(storeId: string, resources: StoreResource[]): void {
  resources.forEach((r) => bumpStore(storeId, r));
  bumpCacheTag(platformTag());
}

export function getCacheTagVersion(tag: string): number {
  return versions.get(tag) ?? 0;
}

export function subscribeCacheTags(
  fn: (tag: string, version: number) => void,
): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Sum of all tag versions — React dep for lifetime UI. */
export function getCacheEpoch(): number {
  let n = 0;
  versions.forEach((v) => {
    n += v;
  });
  return n;
}

/** Parse `store:{id}:{resource}` → parts (or null). */
export function parseStoreTag(
  tag: string,
): { storeId: string; resource: StoreResource } | null {
  const m = /^store:([^:]+):(.+)$/.exec(tag);
  if (!m) return null;
  return { storeId: m[1], resource: m[2] as StoreResource };
}
