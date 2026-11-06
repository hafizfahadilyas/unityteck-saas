/**
 * Master SuperAdmin-only controls for each store's login email:
 * - Active / Inactive
 * - Change login email
 * Merchants cannot change login email from the store portal.
 */

const ACTIVE_KEY = 'unityteck_store_login_email_active';
const EMAIL_OVERRIDE_KEY = 'unityteck_store_login_email_override';

type EmailActiveMap = Record<string, boolean>;
type EmailOverrideMap = Record<string, string>;

function readJson<T extends Record<string, unknown>>(key: string): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {} as T;
    const parsed = JSON.parse(raw) as T;
    return parsed && typeof parsed === 'object' ? parsed : ({} as T);
  } catch {
    return {} as T;
  }
}

function writeJson(key: string, value: Record<string, unknown>): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

/** Default: active (true) unless Master explicitly set inactive. */
export function isStoreLoginEmailActive(storeId: string): boolean {
  const id = String(storeId || '').trim();
  if (!id) return false;
  const map = readJson<EmailActiveMap>(ACTIVE_KEY);
  if (Object.prototype.hasOwnProperty.call(map, id)) {
    return Boolean(map[id]);
  }
  return true;
}

/** Master Admin: set login-email Active / Inactive for a store. */
export function setStoreLoginEmailActive(storeId: string, active: boolean): void {
  const id = String(storeId || '').trim();
  if (!id) return;
  const map = readJson<EmailActiveMap>(ACTIVE_KEY);
  map[id] = Boolean(active);
  writeJson(ACTIVE_KEY, map as Record<string, unknown>);
}

export function toggleStoreLoginEmailActive(storeId: string): boolean {
  const next = !isStoreLoginEmailActive(storeId);
  setStoreLoginEmailActive(storeId, next);
  return next;
}

export function listStoreLoginEmailActiveFlags(): EmailActiveMap {
  return { ...readJson<EmailActiveMap>(ACTIVE_KEY) };
}

/** Master-set login email for a store (overrides seeded / ownerEmail for auth). */
export function getStoreLoginEmailOverride(storeId: string): string | null {
  const id = String(storeId || '').trim();
  if (!id) return null;
  const map = readJson<EmailOverrideMap>(EMAIL_OVERRIDE_KEY);
  const email = String(map[id] || '')
    .trim()
    .toLowerCase();
  return email.includes('@') ? email : null;
}

/**
 * Master SuperAdmin only: change the registered login email for a store.
 * After change, only the new email may open that store.
 */
export function setStoreLoginEmailOverride(storeId: string, email: string): string {
  const id = String(storeId || '').trim();
  const normalized = String(email || '')
    .trim()
    .toLowerCase();
  if (!id) {
    throw new Error('STORE_ID_REQUIRED');
  }
  if (!normalized || !normalized.includes('@') || !normalized.includes('.')) {
    throw new Error('INVALID_EMAIL');
  }
  const map = readJson<EmailOverrideMap>(EMAIL_OVERRIDE_KEY);
  map[id] = normalized;
  writeJson(EMAIL_OVERRIDE_KEY, map as Record<string, unknown>);
  return normalized;
}

export function clearStoreLoginEmailOverride(storeId: string): void {
  const id = String(storeId || '').trim();
  if (!id) return;
  const map = readJson<EmailOverrideMap>(EMAIL_OVERRIDE_KEY);
  delete map[id];
  writeJson(EMAIL_OVERRIDE_KEY, map as Record<string, unknown>);
}

export function listStoreLoginEmailOverrides(): EmailOverrideMap {
  return { ...readJson<EmailOverrideMap>(EMAIL_OVERRIDE_KEY) };
}
