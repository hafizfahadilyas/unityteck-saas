/**
 * Phase 2.7 — SPA subscription lifecycle (mirror App\Support\Subscriptions).
 * Soft UI only — API subscription.writable enforces writes.
 */

export type SubStatus = 'trial' | 'active' | 'grace' | 'expired' | 'suspended';
export type BillingInterval = 'monthly' | 'yearly';

export type SubscriptionInfo = {
  status: SubStatus;
  billingInterval: BillingInterval;
  startsAt: string | null;
  endsAt: string | null;
  graceEndsAt: string | null;
  renewedAt: string | null;
  writable: boolean;
  message: string | null;
};

const GRACE_DAYS = 7;
const STORE_SUB_KEY = 'unityteck_store_subscriptions_v1';

type StoredSub = {
  status: SubStatus;
  billingInterval: BillingInterval;
  startsAt: string | null;
  endsAt: string | null;
  graceEndsAt: string | null;
  renewedAt: string | null;
};

let cachedSubMap: Record<string, StoredSub> | null = null;

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (!e.key || e.key === STORE_SUB_KEY) {
      cachedSubMap = null;
    }
  });
}

function readMap(): Record<string, StoredSub> {
  if (cachedSubMap) return cachedSubMap;
  try {
    const raw = localStorage.getItem(STORE_SUB_KEY);
    if (!raw) {
      cachedSubMap = {};
      return cachedSubMap;
    }
    const parsed = JSON.parse(raw) as Record<string, StoredSub>;
    cachedSubMap = parsed && typeof parsed === 'object' ? parsed : {};
    return cachedSubMap;
  } catch {
    return {};
  }
}

function writeMap(map: Record<string, StoredSub>): void {
  cachedSubMap = map;
  localStorage.setItem(STORE_SUB_KEY, JSON.stringify(map));
}

/** Default demo: active yearly (matches seed store-1). */
export function defaultSubscription(): StoredSub {
  const starts = new Date();
  starts.setMonth(starts.getMonth() - 6);
  const ends = new Date();
  ends.setFullYear(ends.getFullYear() + 1);
  return {
    status: 'active',
    billingInterval: 'yearly',
    startsAt: starts.toISOString(),
    endsAt: ends.toISOString(),
    graceEndsAt: null,
    renewedAt: starts.toISOString(),
  };
}

export function getStoredSubscription(storeId: string): StoredSub {
  const map = readMap();
  if (map[storeId]) return map[storeId];
  // seed store-1 without local override
  if (storeId === 'store-1') return defaultSubscription();
  return {
    status: 'trial',
    billingInterval: 'monthly',
    startsAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 14 * 86400000).toISOString(),
    graceEndsAt: null,
    renewedAt: null,
  };
}

export function setStoredSubscription(
  storeId: string,
  patch: Partial<StoredSub>,
): StoredSub {
  const next = { ...getStoredSubscription(storeId), ...patch };
  const map = readMap();
  map[storeId] = next;
  writeMap(map);
  return next;
}

export function resolveSubscription(storeId: string): SubscriptionInfo {
  const raw = getStoredSubscription(storeId);
  const now = Date.now();

  if (raw.status === 'suspended') {
    return {
      status: 'suspended',
      billingInterval: raw.billingInterval,
      startsAt: raw.startsAt,
      endsAt: raw.endsAt,
      graceEndsAt: raw.graceEndsAt,
      renewedAt: raw.renewedAt,
      writable: false,
      message: 'Subscription suspended by Master Admin.',
    };
  }

  const endsMs = raw.endsAt ? Date.parse(raw.endsAt) : NaN;
  if (!Number.isNaN(endsMs) && now >= endsMs) {
    let graceMs = raw.graceEndsAt ? Date.parse(raw.graceEndsAt) : NaN;
    if (Number.isNaN(graceMs)) {
      graceMs = endsMs + GRACE_DAYS * 86400000;
    }
    if (now < graceMs) {
      return {
        status: 'grace',
        billingInterval: raw.billingInterval,
        startsAt: raw.startsAt,
        endsAt: raw.endsAt,
        graceEndsAt: new Date(graceMs).toISOString(),
        renewedAt: raw.renewedAt,
        writable: true,
        message: 'Subscription in grace period — renew soon.',
      };
    }
    return {
      status: 'expired',
      billingInterval: raw.billingInterval,
      startsAt: raw.startsAt,
      endsAt: raw.endsAt,
      graceEndsAt: new Date(graceMs).toISOString(),
      renewedAt: raw.renewedAt,
      writable: false,
      message: 'Subscription expired — renew to continue editing.',
    };
  }

  const status: SubStatus =
    raw.status === 'trial' || raw.status === 'active' ? raw.status : 'active';

  return {
    status,
    billingInterval: raw.billingInterval,
    startsAt: raw.startsAt,
    endsAt: raw.endsAt,
    graceEndsAt: raw.graceEndsAt,
    renewedAt: raw.renewedAt,
    writable: true,
    message: null,
  };
}

export function subscriptionWritable(storeId: string): boolean {
  return resolveSubscription(storeId).writable;
}
